import Repositorio from './Repositorio';
import ManutencaoFactory from '../models/ManutencaoFactory';
import RegistroNaoEncontradoError from '../errors/RegistroNaoEncontradoError';
import ValidacaoError from '../errors/ValidacaoError';
import { STATUS_MANUTENCAO } from '../utils/constantes';
import { hojeIso } from '../utils/datas';

const SELECAO = `
  SELECT m.*, e.nome AS nome_equipamento
    FROM manutencoes m
    INNER JOIN equipamentos e ON e.id = m.equipamento_id`;

const COLUNAS_ORDENACAO = {
  abertura: 'm.data_abertura',
  prevista: 'm.data_prevista IS NULL, m.data_prevista', // sem previsão vai para o fim
  custo: 'm.custo',
  equipamento: 'e.nome COLLATE NOCASE',
};

const CONDICAO_ABERTA = "m.status IN ('Pendente', 'Em andamento')";
const CONDICAO_ATRASADA = `${CONDICAO_ABERTA} AND m.data_prevista IS NOT NULL AND m.data_prevista < ?`;

// Mantém o status do equipamento em dia: com serviço "Em andamento" ele fica
// "Em manutenção"; quando não há mais nenhum, volta para "Ativo".
// Equipamentos inativos não são alterados.
const SQL_SINCRONIZAR_EQUIPAMENTO = `
  UPDATE equipamentos
     SET status = CASE
           WHEN EXISTS (SELECT 1 FROM manutencoes
                         WHERE equipamento_id = equipamentos.id AND status = 'Em andamento')
             THEN 'Em manutenção'
           WHEN status = 'Em manutenção' THEN 'Ativo'
           ELSE status
         END
   WHERE id = ? AND status <> 'Inativo'`;

class ManutencaoRepository extends Repositorio {
  constructor() {
    super('manutencoes');
  }

  paraModelo(linha) {
    return ManutencaoFactory.criar({
      id: linha.id,
      equipamentoId: linha.equipamento_id,
      nomeEquipamento: linha.nome_equipamento,
      tipo: linha.tipo,
      descricao: linha.descricao,
      tecnico: linha.tecnico,
      dataAbertura: linha.data_abertura,
      dataPrevista: linha.data_prevista,
      dataConclusao: linha.data_conclusao,
      custo: linha.custo,
      status: linha.status,
      periodicidadeDias: linha.periodicidade_dias,
      criadoEm: linha.criado_em,
    });
  }

  #parametros(m) {
    return [
      m.tipo,
      m.descricao,
      m.tecnico,
      m.dataAbertura,
      m.dataPrevista,
      m.dataConclusao,
      m.custo,
      m.status,
      m.periodicidadeDias, // polimorfismo: null na corretiva
    ];
  }

  #tratarEquipamentoInexistente(erro) {
    if (String(erro?.message).includes('FOREIGN KEY')) {
      throw new ValidacaoError({ equipamentoId: 'O equipamento selecionado não existe mais.' });
    }
    throw erro;
  }

  async inserir(manutencao) {
    manutencao.validar();
    return this.executar('Não foi possível registrar a manutenção.', async (db) => {
      try {
        // Transação: ou grava a manutenção E atualiza o equipamento, ou nada.
        await db.withTransactionAsync(async () => {
          const resultado = await db.runAsync(
            `INSERT INTO manutencoes
               (tipo, descricao, tecnico, data_abertura, data_prevista, data_conclusao,
                custo, status, periodicidade_dias, equipamento_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [...this.#parametros(manutencao), manutencao.equipamentoId],
          );
          await db.runAsync(SQL_SINCRONIZAR_EQUIPAMENTO, [manutencao.equipamentoId]);
          manutencao.definirId(resultado.lastInsertRowId);
        });
        return manutencao;
      } catch (erro) {
        this.#tratarEquipamentoInexistente(erro);
      }
    });
  }

  async atualizar(manutencao) {
    manutencao.validar();
    return this.executar('Não foi possível salvar as alterações da manutenção.', async (db) => {
      await db.withTransactionAsync(async () => {
        const resultado = await db.runAsync(
          `UPDATE manutencoes
              SET tipo = ?, descricao = ?, tecnico = ?, data_abertura = ?, data_prevista = ?,
                  data_conclusao = ?, custo = ?, status = ?, periodicidade_dias = ?
            WHERE id = ?`,
          [...this.#parametros(manutencao), manutencao.id],
        );
        if (resultado.changes === 0) throw new RegistroNaoEncontradoError('Manutenção não encontrada.');
        await db.runAsync(SQL_SINCRONIZAR_EQUIPAMENTO, [manutencao.equipamentoId]);
      });
      return manutencao;
    });
  }

  // Sobrescreve o excluir da classe base para também atualizar o equipamento.
  async excluir(id) {
    return this.executar('Não foi possível excluir a manutenção.', async (db) => {
      await db.withTransactionAsync(async () => {
        const linha = await db.getFirstAsync('SELECT equipamento_id FROM manutencoes WHERE id = ?', [id]);
        if (!linha) throw new RegistroNaoEncontradoError('Manutenção não encontrada.');
        await db.runAsync('DELETE FROM manutencoes WHERE id = ?', [id]);
        await db.runAsync(SQL_SINCRONIZAR_EQUIPAMENTO, [linha.equipamento_id]);
      });
    });
  }

  async buscarPorId(id) {
    return this.executar('Não foi possível carregar a manutenção.', async (db) => {
      const linha = await db.getFirstAsync(`${SELECAO} WHERE m.id = ?`, [id]);
      if (!linha) throw new RegistroNaoEncontradoError('Manutenção não encontrada. Ela pode ter sido excluída.');
      return this.paraModelo(linha);
    });
  }

  // situacao: 'abertas', 'atrasadas' ou um dos status (Pendente, Concluída...).
  async listar({
    equipamentoId = null,
    situacao = null,
    tipo = null,
    busca = '',
    ordenarPor = 'abertura',
    crescente = false,
    limite = null,
  } = {}) {
    const condicoes = [];
    const parametros = [];

    if (equipamentoId) {
      condicoes.push('m.equipamento_id = ?');
      parametros.push(equipamentoId);
    }
    if (situacao === 'abertas') {
      condicoes.push(CONDICAO_ABERTA);
    } else if (situacao === 'atrasadas') {
      condicoes.push(CONDICAO_ATRASADA);
      parametros.push(hojeIso());
    } else if (STATUS_MANUTENCAO.includes(situacao)) {
      condicoes.push('m.status = ?');
      parametros.push(situacao);
    }
    if (tipo) {
      condicoes.push('m.tipo = ?');
      parametros.push(tipo);
    }
    if (busca.trim()) {
      const termo = `%${busca.trim()}%`;
      condicoes.push('(m.descricao LIKE ? OR m.tecnico LIKE ? OR e.nome LIKE ?)');
      parametros.push(termo, termo, termo);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const ordem = COLUNAS_ORDENACAO[ordenarPor] ?? COLUNAS_ORDENACAO.abertura;
    let sql = `${SELECAO} ${where} ORDER BY ${ordem} ${crescente ? 'ASC' : 'DESC'}, m.id DESC`;
    if (limite) {
      sql += ' LIMIT ?';
      parametros.push(limite);
    }

    return this.executar('Não foi possível carregar as manutenções.', async (db) => {
      const linhas = await db.getAllAsync(sql, parametros);
      return linhas.map((linha) => this.paraModelo(linha));
    });
  }

  async resumo() {
    return this.executar('Não foi possível carregar o resumo das manutenções.', async (db) => {
      const linha = await db.getFirstAsync(
        `SELECT COUNT(*)                     AS total,
                SUM(m.status = 'Pendente')     AS pendentes,
                SUM(m.status = 'Em andamento') AS em_andamento,
                SUM(m.status = 'Concluída')    AS concluidas,
                SUM(${CONDICAO_ATRASADA})      AS atrasadas,
                SUM(CASE WHEN m.status = 'Concluída' THEN m.custo ELSE 0 END) AS custo_concluidas
           FROM manutencoes m`,
        [hojeIso()],
      );
      return {
        total: linha.total ?? 0,
        pendentes: linha.pendentes ?? 0,
        emAndamento: linha.em_andamento ?? 0,
        concluidas: linha.concluidas ?? 0,
        atrasadas: linha.atrasadas ?? 0,
        custoConcluidas: linha.custo_concluidas ?? 0,
      };
    });
  }
}

export default new ManutencaoRepository();
