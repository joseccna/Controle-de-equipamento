// Guarda o filtro escolhido no Painel até a tela de lista ganhar foco.
// É lido uma única vez: depois de consumido, a lista volta a funcionar normalmente.
const pendentes = {};

export function definirFiltroPendente(tela, valor) {
  pendentes[tela] = valor;
}

// Devolve undefined quando não há filtro pendente para a tela.
export function consumirFiltroPendente(tela) {
  const valor = pendentes[tela];
  delete pendentes[tela];
  return valor;
}
