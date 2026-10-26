export const STATUS_EQUIPAMENTO = ['Ativo', 'Em manutenção', 'Inativo'];

export const CATEGORIAS = ['Informática', 'Elétrico', 'Refrigeração', 'Mecânico', 'Hidráulico', 'Outros'];

export const TIPOS_MANUTENCAO = ['Preventiva', 'Corretiva'];

export const STATUS_MANUTENCAO = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];

// Situações usadas no filtro da lista de manutenções (além dos status).
export const SITUACOES_MANUTENCAO = [
  { valor: 'abertas', rotulo: 'Abertas' },
  { valor: 'atrasadas', rotulo: 'Atrasadas' },
  ...STATUS_MANUTENCAO.map((s) => ({ valor: s, rotulo: s })),
];

export const ORDENACAO_EQUIPAMENTOS = [
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'codigo', rotulo: 'Código' },
  { valor: 'categoria', rotulo: 'Categoria' },
  { valor: 'aquisicao', rotulo: 'Aquisição' },
  { valor: 'manutencoes', rotulo: 'Nº manutenções' },
];

export const ORDENACAO_MANUTENCOES = [
  { valor: 'abertura', rotulo: 'Abertura' },
  { valor: 'prevista', rotulo: 'Previsão' },
  { valor: 'custo', rotulo: 'Custo' },
  { valor: 'equipamento', rotulo: 'Equipamento' },
];
