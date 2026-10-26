// Aceita "150", "150,50", "1.250,90" ou "150.5". Campo vazio vale 0.
// Texto que não é número vira NaN, e a validação do modelo acusa o erro.
export function textoParaNumero(texto) {
  const valor = (texto ?? '').toString().trim();
  if (!valor) return 0;
  const normalizado = valor.includes(',') ? valor.replace(/\./g, '').replace(',', '.') : valor;
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

export function numeroParaTexto(numero) {
  return numero ? String(numero).replace('.', ',') : '';
}

export function formatarMoeda(valor) {
  const [inteiro, centavos] = (Number(valor) || 0).toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${comMilhar},${centavos}`;
}
