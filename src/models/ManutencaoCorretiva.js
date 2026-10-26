import Manutencao from './Manutencao';

export default class ManutencaoCorretiva extends Manutencao {
  get tipo() {
    return 'Corretiva';
  }

  get descricaoTipo() {
    return 'Reparo de um defeito ou falha que já aconteceu no equipamento.';
  }

  // Corretiva significa equipamento com defeito: prioridade sempre alta.
  calcularPrioridade() {
    return this.estaAtrasada ? 'Urgente' : 'Alta';
  }

  validarRegrasDoTipo(erros) {
    if (!erros.descricao && this.descricao.length < 10) {
      erros.descricao = 'Na corretiva, descreva o defeito com pelo menos 10 caracteres.';
    }
  }
}
