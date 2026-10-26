import Repositorio from './Repositorio';
import Equipamento from '../models/Equipamento';
import RegistroNaoEncontradoError from '../errors/RegistroNaoEncontradoError';
import ValidacaoError from '../errors/ValidacaoError';

const SELECAO = `
  SELECT e.*,
         (SELECT COUNT(*) FROM manutencoes m WHERE m.equipamento_id = e.id) AS total_manutencoes
    FROM equipamentos e`;

// Lista fechada de colunas: o usuário escolhe a chave, nunca o SQL (evita SQL injection).
const COLUNAS_ORDENACAO = {
  nome: 'e.nome COLLATE NOCASE',
  codigo: 'e.codigo_patrimonio',
  categoria: 'e.categoria COLLATE NOCASE',
  aquisicao: 'e.data_aquisicao',
  manutencoes: 'total_manutencoes',
};

class EquipamentoRepository extends Repositorio {
  constructor() {
    super('equipamentos');
  }

  paraModelo(linha) {
    return new Equipamento({
      id: linha.id,
      nome: linha.nome,
      codigoPatrimonio: linha.codigo_patrimonio,
      categoria: linha.categoria,
      marca: linha.marca,
      modelo: linha.modelo,
      localizacao: linha.localizacao,
      dataAquisicao: linha.data_aquisicao,
      status: linha.status,
      criadoEm: linha.criado_em,
      totalManutencoes: linha.total_manutencoes,
    });
  }

  #parametros(e) {
    return [
      e.nome,
      e.codigoPatrimonio,
      e.categoria,
      e.marca || null,
      e.modelo || null,
      e.localizacao || null,
      e.dataAquisicao,
      e.status,
    ];
  }

  // Código de patrimônio repetido é erro do usuário, não do sistema.
  #tratarDuplicidade(erro) {
    if (String(erro?.message).includes('UNIQUE')) {
      throw new ValidacaoError({
        codigoPatrimonio: 'Já existe um equipamento com este código de patrimônio.',
      });
    }
    throw erro;
  }

  async inserir(equipamento) {
    equipamento.validar();
    return this.executar('Não foi possível cadastrar o equipamento.', async (db) => {
      try {
        const resultado = await db.runAsync(
          `INSERT INTO equipamentos
             (nome, codigo_patrimonio, categoria, marca, modelo, localizacao, data_aquisicao, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          this.#parametros(equipamento),
        );
        equipamento.definirId(resultado.lastInsertRowId);
        return equipamento;
      } catch (erro) {
        this.#tratarDuplicidade(erro);
      }
    });
  }

  async atualizar(equipamento) {
    equipamento.validar();
    return this.executar('Não foi possível salvar as alterações do equipamento.', async (db) => {
      let resultado;
      try {
        resultado = await db.runAsync(
          `UPDATE equipamentos
              SET nome = ?, codigo_patrimonio = ?, categoria = ?, marca = ?, modelo = ?,
                  localizacao = ?, data_aquisicao = ?, status = ?
            WHERE id = ?`,
          [...this.#parametros(equipamento), equipamento.id],
        );
      } catch (erro) {
        this.#tratarDuplicidade(erro);
      }
      if (resultado.changes === 0) throw new RegistroNaoEncontradoError('Equipamento não encontrado.');
      return equipamento;
    });
  }

  async buscarPorId(id) {
    return this.executar('Não foi possível carregar o equipamento.', async (db) => {
      const linha = await db.getFirstAsync(`${SELECAO} WHERE e.id = ?`, [id]);
      if (!linha) throw new RegistroNaoEncontradoError('Equipamento não encontrado. Ele pode ter sido excluído.');
      return this.paraModelo(linha);
    });
  }

  async listar({ busca = '', status = null, categoria = null, ordenarPor = 'nome', crescente = true } = {}) {
    const condicoes = [];
    const parametros = [];

    if (busca.trim()) {
      const termo = `%${busca.trim()}%`;
      condicoes.push('(e.nome LIKE ? OR e.codigo_patrimonio LIKE ? OR e.localizacao LIKE ?)');
      parametros.push(termo, termo, termo);
    }
    if (status) {
      condicoes.push('e.status = ?');
      parametros.push(status);
    }
    if (categoria) {
      condicoes.push('e.categoria = ?');
      parametros.push(categoria);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const ordem = COLUNAS_ORDENACAO[ordenarPor] ?? COLUNAS_ORDENACAO.nome;
    const sql = `${SELECAO} ${where} ORDER BY ${ordem} ${crescente ? 'ASC' : 'DESC'}, e.id`;

    return this.executar('Não foi possível carregar a lista de equipamentos.', async (db) => {
      const linhas = await db.getAllAsync(sql, parametros);
      return linhas.map((linha) => this.paraModelo(linha));
    });
  }

  async resumo() {
    return this.executar('Não foi possível carregar o resumo dos equipamentos.', async (db) => {
      const linha = await db.getFirstAsync(`
        SELECT COUNT(*)                     AS total,
               SUM(status = 'Ativo')         AS ativos,
               SUM(status = 'Em manutenção') AS em_manutencao,
               SUM(status = 'Inativo')       AS inativos
          FROM equipamentos`);
      return {
        total: linha.total ?? 0,
        ativos: linha.ativos ?? 0,
        emManutencao: linha.em_manutencao ?? 0,
        inativos: linha.inativos ?? 0,
      };
    });
  }
}

export default new EquipamentoRepository();
