export const cores = {
  primaria: '#1F5FAD',
  primariaClara: '#E7EFFA',
  fundo: '#F3F5F8',
  superficie: '#FFFFFF',
  texto: '#1C2430',
  textoSuave: '#5B6675',
  borda: '#D9DEE5',
  perigo: '#C62828',
  sucesso: '#2E7D32',
  alerta: '#E08A00',
  info: '#0277BD',
  neutro: '#78838F',
};

export const coresStatus = {
  Ativo: cores.sucesso,
  'Em manutenção': cores.alerta,
  Inativo: cores.neutro,
  Pendente: cores.info,
  'Em andamento': cores.alerta,
  Concluída: cores.sucesso,
  Cancelada: cores.neutro,
};

export const coresPrioridade = {
  Urgente: cores.perigo,
  Alta: '#D84315',
  Média: cores.alerta,
  Baixa: cores.info,
  Encerrada: cores.neutro,
};
