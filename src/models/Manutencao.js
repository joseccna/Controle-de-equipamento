import Entidade from './Entidade';
import ValidacaoError from '../errors/ValidacaoError';
import { STATUS_MANUTENCAO } from '../utils/constantes';
import { hojeIso, isoParaBr, isoValida } from '../utils/datas';
import { numeroParaTexto } from '../utils/numeros';

const texto = (valor) => (valor ?? '').toString().trim();
const DATA_INVALIDA = 'Data inválida. Use DD/MM/AAAA.';

// Regras comuns a qualquer manutenção. Algumas dependem de outros campos (m).
const REGRAS = {
  equipamentoId: (v) => (Number.isInteger(v) && v > 0 ? null : 'Selecione o equipamento.'),
  descricao: (v) => {
    if (!v) return 'Descreva o serviço.';
    if (v.length < 5) return 'A descrição deve ter pelo menos 5 caracteres.';
    if (v.length > 500) return 'A descrição deve ter no máximo 500 caracteres.';
    return null;
  },
  tecnico: (v) => {
    if (!v) return 'Informe o técnico responsável.';
    if (v.length < 3) return 'O nome do técnico deve ter pelo menos 3 caracteres.';
    return null;
  },
  dataAbertura: (v) => {
    if (!v) return 'Informe a data de abertura.';
    if (!isoValida(v)) return DATA_INVALIDA;
    if (v > hojeIso()) return 'A data de abertura não pode estar no futuro.';
    return null;
  },
  dataPrevista: (v, m) => {
    if (!v) return null;
    if (!isoValida(v)) return DATA_INVALIDA;
    if (isoValida(m.dataAbertura) && v < m.dataAbertura) {
      return 'A data prevista não pode ser anterior à abertura.';
    }
    return null;
  },
  dataConclusao: (v, m) => {
    if (!v) return m.status === 'Concluída' ? 'Informe a data de conclusão.' : null;
    if (!isoValida(v)) return DATA_INVALIDA;
    if (m.status !== 'Concluída') return 'A conclusão só pode ser informada com status "Concluída".';
    if (v > hojeIso()) return 'A data de conclusão não pode estar no futuro.';
    if (isoValida(m.dataAbertura) && v < m.dataAbertura) {
      return 'A conclusão não pode ser anterior à abertura.';
    }
    return null;
  },
  custo: (v) => {
    if (typeof v !== 'number' || Number.isNaN(v)) return 'Custo inválido. Exemplo: 150,00';
    if (v < 0) return 'O custo não pode ser negativo.';
    if (v > 1000000) return 'O custo não pode passar de R$ 1.000.000,00.';
    return null;
  },
  status: (v) => (STATUS_MANUTENCAO.includes(v) ? null : 'Selecione um status válido.'),
};

// Classe base (abstrata). As subclasses ManutencaoPreventiva e ManutencaoCorretiva
// definem o tipo, a prioridade e regras de validação próprias (polimorfismo).
export default class Manutencao extends Entidade {
  #equipamentoId;
  #descricao;
  #tecnico;
  #dataAbertura;
  #dataPrevista;
  #dataConclusao;
  #custo;
  #status;
  #nomeEquipamento;

  constructor(dados = {}) {
    if (new.target === Manutencao) {
      throw new Error('Manutencao é abstrata: use ManutencaoPreventiva ou ManutencaoCorretiva.');
    }
    super(dados.id ?? null, dados.criadoEm ?? null);
    this.#equipamentoId = dados.equipamentoId ? Number(dados.equipamentoId) : null;
    this.#descricao = texto(dados.descricao);
    this.#tecnico = texto(dados.tecnico);
    this.#dataAbertura = dados.dataAbertura || null;
    this.#dataPrevista = dados.dataPrevista || null;
    this.#dataConclusao = dados.dataConclusao || null;
    this.#custo = dados.custo ?? 0;
    this.#status = dados.status ?? 'Pendente';
    this.#nomeEquipamento = dados.nomeEquipamento ?? '';
  }

  // --- Métodos que as subclasses precisam implementar ---
  get tipo() {
    throw new Error(`${this.constructor.name} precisa implementar "tipo".`);
  }

  get descricaoTipo() {
    throw new Error(`${this.constructor.name} precisa implementar "descricaoTipo".`);
  }

  calcularPrioridade() {
    throw new Error(`${this.constructor.name} precisa implementar calcularPrioridade().`);
  }

  // Gancho opcional: regras extras de cada tipo.
  validarRegrasDoTipo(_erros) {}

  // Só a preventiva tem periodicidade; nas outras é sempre null.
  get periodicidadeDias() {
    return null;
  }

  proximaManutencao() {
    return null;
  }

  // --- Getters e setters ---
  get equipamentoId() { return this.#equipamentoId; }
  get nomeEquipamento() { return this.#nomeEquipamento; }

  get descricao() { return this.#descricao; }
  set descricao(valor) { this.#descricao = this.#conferir('descricao', texto(valor)); }

  get tecnico() { return this.#tecnico; }
  set tecnico(valor) { this.#tecnico = this.#conferir('tecnico', texto(valor)); }

  get dataAbertura() { return this.#dataAbertura; }
  get dataPrevista() { return this.#dataPrevista; }
  get dataConclusao() { return this.#dataConclusao; }

  get custo() { return this.#custo; }
  set custo(valor) { this.#custo = this.#conferir('custo', valor); }

  get status() { return this.#status; }
  set status(valor) { this.#status = this.#conferir('status', valor); }

  // --- Regras de negócio comuns ---
  get estaAberta() {
    return this.#status === 'Pendente' || this.#status === 'Em andamento';
  }

  get estaAtrasada() {
    return this.estaAberta && this.#dataPrevista !== null && this.#dataPrevista < hojeIso();
  }

  // Método template: a parte comum fica aqui, o cálculo vem de cada subclasse.
  getPrioridade() {
    return this.estaAberta ? this.calcularPrioridade() : 'Encerrada';
  }

  #conferir(campo, valor) {
    const erro = REGRAS[campo](valor, this);
    if (erro) throw new ValidacaoError({ [campo]: erro });
    return valor;
  }

  coletarErros() {
    const erros = {};
    for (const [campo, regra] of Object.entries(REGRAS)) {
      const erro = regra(this[campo], this);
      if (erro) erros[campo] = erro;
    }
    this.validarRegrasDoTipo(erros);
    return erros;
  }

  paraFormulario() {
    return {
      tipo: this.tipo,
      equipamentoId: this.#equipamentoId,
      descricao: this.#descricao,
      tecnico: this.#tecnico,
      dataAbertura: isoParaBr(this.#dataAbertura),
      dataPrevista: isoParaBr(this.#dataPrevista),
      dataConclusao: isoParaBr(this.#dataConclusao),
      custo: numeroParaTexto(this.#custo),
      status: this.#status,
      periodicidadeDias: this.periodicidadeDias ? String(this.periodicidadeDias) : '',
    };
  }
}
