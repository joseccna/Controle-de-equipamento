// No banco as datas ficam no formato ISO (AAAA-MM-DD), que permite ordenar e
// comparar como texto no SQL. Na tela o usuário vê e digita DD/MM/AAAA.

const doisDigitos = (n) => String(n).padStart(2, '0');

export function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

// Converte DD/MM/AAAA -> AAAA-MM-DD. Se o texto estiver fora do formato,
// devolve o próprio texto para que a validação do modelo acuse o erro.
export function brParaIso(texto) {
  const valor = (texto ?? '').trim();
  if (!valor) return null;
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : valor;
}

export function isoParaBr(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// Verifica formato e se a data existe de verdade (ex.: 31/02 é inválida).
export function isoValida(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

export function somarDias(iso, dias) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia + dias);
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// Máscara para o campo de data: insere as barras enquanto o usuário digita.
export function mascaraData(texto) {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}
