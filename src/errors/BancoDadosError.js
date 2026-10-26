// Falha ao acessar o SQLite. A mensagem é amigável para o usuário;
// o erro técnico original fica em "causa" para depuração.
export default class BancoDadosError extends Error {
  constructor(mensagem, causa = null) {
    super(mensagem);
    this.name = 'BancoDadosError';
    this.causa = causa;
  }
}
