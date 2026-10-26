import { Alert } from 'react-native';
import ValidacaoError from '../errors/ValidacaoError';
import BancoDadosError from '../errors/BancoDadosError';

export function mostrarErro(erro, titulo = 'Erro') {
  if (erro instanceof ValidacaoError) {
    Alert.alert('Verifique os dados', erro.message);
  } else if (erro instanceof BancoDadosError) {
    Alert.alert(titulo, erro.message);
  } else {
    console.error(erro);
    Alert.alert(titulo, 'Ocorreu um erro inesperado. Tente novamente.');
  }
}

// Nos formulários, erros de validação também marcam os campos em vermelho.
export function tratarErroFormulario(erro, definirErros) {
  if (erro instanceof ValidacaoError) definirErros(erro.erros);
  mostrarErro(erro);
}

export function confirmar(titulo, mensagem, aoConfirmar) {
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: aoConfirmar },
  ]);
}
