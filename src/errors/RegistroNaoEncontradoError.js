import BancoDadosError from './BancoDadosError';

export default class RegistroNaoEncontradoError extends BancoDadosError {
  constructor(mensagem = 'Registro não encontrado. Ele pode ter sido excluído.') {
    super(mensagem);
    this.name = 'RegistroNaoEncontradoError';
  }
}
