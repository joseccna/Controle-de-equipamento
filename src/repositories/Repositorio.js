import Database from '../database/Database';
import BancoDadosError from '../errors/BancoDadosError';
import RegistroNaoEncontradoError from '../errors/RegistroNaoEncontradoError';
import ValidacaoError from '../errors/ValidacaoError';

// Classe base dos repositórios: concentra o acesso ao banco e o tratamento de erros.
export default class Repositorio {
  #tabela;

  constructor(tabela) {
    if (new.target === Repositorio) {
      throw new Error('Repositorio é abstrato: use um repositório específico.');
    }
    this.#tabela = tabela;
  }

  get tabela() {
    return this.#tabela;
  }

  // Converte uma linha do banco (snake_case) em objeto do modelo.
  paraModelo(_linha) {
    throw new Error(`${this.constructor.name} precisa implementar paraModelo().`);
  }

  // Toda operação passa por aqui. Erros já tratados seguem como estão; qualquer
  // outra falha do SQLite vira um BancoDadosError com mensagem compreensível.
  async executar(mensagemErro, operacao) {
    try {
      const db = await Database.obter();
      return await operacao(db);
    } catch (erro) {
      if (erro instanceof ValidacaoError || erro instanceof BancoDadosError) throw erro;
      console.warn(`[${this.constructor.name}] ${mensagemErro}`, erro);
      throw new BancoDadosError(mensagemErro, erro);
    }
  }

  async excluir(id) {
    return this.executar('Não foi possível excluir o registro.', async (db) => {
      const resultado = await db.runAsync(`DELETE FROM ${this.#tabela} WHERE id = ?`, [id]);
      if (resultado.changes === 0) throw new RegistroNaoEncontradoError();
    });
  }
}
