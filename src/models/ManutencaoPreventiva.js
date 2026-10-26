import Manutencao from './Manutencao';
import ValidacaoError from '../errors/ValidacaoError';
import { somarDias } from '../utils/datas';

const regraPeriodicidade = (p) =>
  p === null || (Number.isInteger(p) && p >= 1 && p <= 730)
    ? null
    : 'Periodicidade: informe um número inteiro de dias (1 a 730).';

export default class ManutencaoPreventiva extends Manutencao {
  #periodicidadeDias;

  constructor(dados = {}) {
    super(dados);
    const p = dados.periodicidadeDias;
    this.#periodicidadeDias = p === null || p === undefined || p === '' ? null : Number(p);
  }

  get tipo() {
    return 'Preventiva';
  }

  get descricaoTipo() {
    return 'Revisão programada para evitar falhas: limpeza, troca de peças, calibração.';
  }

  get periodicidadeDias() {
    return this.#periodicidadeDias;
  }

  set periodicidadeDias(valor) {
    const erro = regraPeriodicidade(valor);
    if (erro) throw new ValidacaoError({ periodicidadeDias: erro });
    this.#periodicidadeDias = valor;
  }

  // Preventiva é planejada: só sobe de prioridade se passar da data prevista.
  calcularPrioridade() {
    return this.estaAtrasada ? 'Média' : 'Baixa';
  }

  validarRegrasDoTipo(erros) {
    if (!this.dataPrevista && !erros.dataPrevista) {
      erros.dataPrevista = 'A manutenção preventiva precisa de uma data prevista.';
    }
    const erro = regraPeriodicidade(this.#periodicidadeDias);
    if (erro) erros.periodicidadeDias = erro;
  }

  // Depois de concluída, sugere a data da próxima revisão.
  proximaManutencao() {
    if (this.status !== 'Concluída' || !this.dataConclusao || !this.#periodicidadeDias) return null;
    return somarDias(this.dataConclusao, this.#periodicidadeDias);
  }
}
