import Entidade from './Entidade';
import ValidacaoError from '../errors/ValidacaoError';
import { CATEGORIAS, STATUS_EQUIPAMENTO } from '../utils/constantes';
import { brParaIso, hojeIso, isoParaBr, isoValida } from '../utils/datas';

const texto = (valor) => (valor ?? '').toString().trim();

const tamanhoMaximo = (rotulo, max) => (v) =>
  v.length > max ? `${rotulo} deve ter no máximo ${max} caracteres.` : null;

// Uma regra por campo: devolve a mensagem de erro ou null se estiver tudo certo.
const REGRAS = {
  nome: (v) => {
    if (!v) return 'Informe o nome do equipamento.';
    if (v.length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
    return tamanhoMaximo('O nome', 60)(v);
  },
  codigoPatrimonio: (v) => {
    if (!v) return 'Informe o código de patrimônio.';
    if (!/^[A-Z0-9-]{3,20}$/.test(v)) return 'Código: use de 3 a 20 letras, números ou hífen.';
    return null;
  },
  categoria: (v) => (CATEGORIAS.includes(v) ? null : 'Selecione uma categoria.'),
  marca: tamanhoMaximo('A marca', 40),
  modelo: tamanhoMaximo('O modelo', 40),
  localizacao: tamanhoMaximo('A localização', 60),
  dataAquisicao: (v) => {
    if (v === null) return null;
    if (!isoValida(v)) return 'Data de aquisição inválida. Use DD/MM/AAAA.';
    if (v > hojeIso()) return 'A data de aquisição não pode estar no futuro.';
    return null;
  },
  status: (v) => (STATUS_EQUIPAMENTO.includes(v) ? null : 'Selecione um status válido.'),
};

export default class Equipamento extends Entidade {
  #nome;
  #codigoPatrimonio;
  #categoria;
  #marca;
  #modelo;
  #localizacao;
  #dataAquisicao;
  #status;
  #totalManutencoes;

  constructor(dados = {}) {
    super(dados.id ?? null, dados.criadoEm ?? null);
    // Atribuição direta, sem validar: a validação completa acontece em validar(),
    // assim o formulário consegue mostrar todos os erros de uma só vez.
    this.#nome = texto(dados.nome);
    this.#codigoPatrimonio = texto(dados.codigoPatrimonio).toUpperCase();
    this.#categoria = texto(dados.categoria);
    this.#marca = texto(dados.marca);
    this.#modelo = texto(dados.modelo);
    this.#localizacao = texto(dados.localizacao);
    this.#dataAquisicao = dados.dataAquisicao || null;
    this.#status = dados.status ?? 'Ativo';
    this.#totalManutencoes = dados.totalManutencoes ?? 0;
  }

  // Cria o objeto a partir do que foi digitado na tela (datas em DD/MM/AAAA).
  static deFormulario(form) {
    return new Equipamento({ ...form, dataAquisicao: brParaIso(form.dataAquisicao) });
  }

  get nome() { return this.#nome; }
  set nome(valor) { this.#nome = this.#conferir('nome', texto(valor)); }

  get codigoPatrimonio() { return this.#codigoPatrimonio; }
  set codigoPatrimonio(valor) {
    this.#codigoPatrimonio = this.#conferir('codigoPatrimonio', texto(valor).toUpperCase());
  }

  get categoria() { return this.#categoria; }
  set categoria(valor) { this.#categoria = this.#conferir('categoria', texto(valor)); }

  get marca() { return this.#marca; }
  set marca(valor) { this.#marca = this.#conferir('marca', texto(valor)); }

  get modelo() { return this.#modelo; }
  set modelo(valor) { this.#modelo = this.#conferir('modelo', texto(valor)); }

  get localizacao() { return this.#localizacao; }
  set localizacao(valor) { this.#localizacao = this.#conferir('localizacao', texto(valor)); }

  get dataAquisicao() { return this.#dataAquisicao; }
  set dataAquisicao(valor) { this.#dataAquisicao = this.#conferir('dataAquisicao', valor || null); }

  get status() { return this.#status; }
  set status(valor) { this.#status = this.#conferir('status', valor); }

  get totalManutencoes() { return this.#totalManutencoes; }

  get estaInativo() {
    return this.#status === 'Inativo';
  }

  // Os setters usam este método: um valor inválido nunca entra no objeto.
  #conferir(campo, valor) {
    const erro = REGRAS[campo](valor);
    if (erro) throw new ValidacaoError({ [campo]: erro });
    return valor;
  }

  coletarErros() {
    const erros = {};
    for (const [campo, regra] of Object.entries(REGRAS)) {
      const erro = regra(this[campo]);
      if (erro) erros[campo] = erro;
    }
    return erros;
  }

  paraFormulario() {
    return {
      nome: this.#nome,
      codigoPatrimonio: this.#codigoPatrimonio,
      categoria: this.#categoria,
      marca: this.#marca,
      modelo: this.#modelo,
      localizacao: this.#localizacao,
      dataAquisicao: isoParaBr(this.#dataAquisicao),
      status: this.#status,
    };
  }
}
