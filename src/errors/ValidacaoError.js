// Erro de entrada do usuário. Guarda as mensagens por campo
// ({ nome: '...', custo: '...' }) para a tela destacar cada campo.
export default class ValidacaoError extends Error {
  constructor(erros) {
    super(Object.values(erros).join('\n'));
    this.name = 'ValidacaoError';
    this.erros = erros;
  }
}
