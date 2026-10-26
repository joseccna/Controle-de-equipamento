import ManutencaoPreventiva from './ManutencaoPreventiva';
import ManutencaoCorretiva from './ManutencaoCorretiva';
import ValidacaoError from '../errors/ValidacaoError';
import { brParaIso } from '../utils/datas';
import { textoParaNumero } from '../utils/numeros';

const CLASSES = {
  Preventiva: ManutencaoPreventiva,
  Corretiva: ManutencaoCorretiva,
};

// Escolhe a subclasse certa a partir do "tipo". O resto do app trabalha só
// com a classe base Manutencao, sem precisar saber qual é a subclasse.
export default class ManutencaoFactory {
  static criar(dados) {
    const Classe = CLASSES[dados.tipo];
    if (!Classe) throw new ValidacaoError({ tipo: 'Selecione o tipo de manutenção.' });
    return new Classe(dados);
  }

  static deFormulario(form) {
    const periodicidade = (form.periodicidadeDias ?? '').trim();
    return ManutencaoFactory.criar({
      ...form,
      dataAbertura: brParaIso(form.dataAbertura),
      dataPrevista: brParaIso(form.dataPrevista),
      dataConclusao: brParaIso(form.dataConclusao),
      custo: textoParaNumero(form.custo),
      periodicidadeDias: periodicidade ? Number(periodicidade) : null,
    });
  }

  static descricaoDoTipo(tipo) {
    const Classe = CLASSES[tipo];
    return Classe ? new Classe().descricaoTipo : '';
  }
}
