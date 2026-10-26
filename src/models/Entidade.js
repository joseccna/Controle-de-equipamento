import ValidacaoError from '../errors/ValidacaoError';

// Classe base (abstrata) de tudo que é salvo no banco.
export default class Entidade {
  #id;
  #criadoEm;

  constructor(id = null, criadoEm = null) {
    if (new.target === Entidade) {
      throw new Error('Entidade é abstrata e não pode ser instanciada diretamente.');
    }
    this.#id = id;
    this.#criadoEm = criadoEm;
  }

  get id() {
    return this.#id;
  }

  get criadoEm() {
    return this.#criadoEm;
  }

  get ehNova() {
    return this.#id === null;
  }

  // Usado pelo repositório depois do INSERT. O id só pode ser definido uma vez.
  definirId(id) {
    if (this.#id !== null) throw new Error('O id de um registro salvo não pode ser alterado.');
    this.#id = id;
  }

  // Cada subclasse devolve { campo: mensagem } com os problemas encontrados.
  coletarErros() {
    throw new Error(`${this.constructor.name} precisa implementar coletarErros().`);
  }

  validar() {
    const erros = this.coletarErros();
    if (Object.keys(erros).length > 0) throw new ValidacaoError(erros);
  }
}
