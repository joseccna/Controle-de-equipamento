import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import equipamentoRepository from '../../repositories/EquipamentoRepository';
import CampoTexto from '../../components/CampoTexto';
import SeletorOpcoes from '../../components/SeletorOpcoes';
import ControleOrdenacao from '../../components/ControleOrdenacao';
import { Badge, BotaoFlutuante, Cartao, EstadoVazio } from '../../components/Basicos';
import { CATEGORIAS, ORDENACAO_EQUIPAMENTOS, STATUS_EQUIPAMENTO } from '../../utils/constantes';
import { mostrarErro } from '../../utils/alertas';
import { consumirFiltroPendente } from '../../utils/filtroPendente';
import { cores, coresStatus } from '../../utils/tema';

export default function EquipamentosScreen() {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [ordenacao, setOrdenacao] = useState({ ordenarPor: 'nome', crescente: true });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [equipamentos, setEquipamentos] = useState([]);

  // Cada mudança de filtro gera uma nova consulta SQL com WHERE e ORDER BY.
  const carregar = useCallback(async () => {
    try {
      setEquipamentos(await equipamentoRepository.listar({ busca, status, categoria, ...ordenacao }));
    } catch (erro) {
      mostrarErro(erro);
    }
  }, [busca, status, categoria, ordenacao]);

  // Ao ganhar foco, aplica o filtro vindo do Painel (se houver). Se ele mudar o
  // status, o carregar muda junto e este efeito roda de novo com o filtro novo.
  useFocusEffect(
    useCallback(() => {
      const filtro = consumirFiltroPendente('equipamentos');
      if (filtro !== undefined) {
        setMostrarFiltros(filtro !== null);
        if (filtro !== status) {
          setStatus(filtro);
          return;
        }
      }
      carregar();
    }, [carregar, status]),
  );

  const filtrosAtivos = [status, categoria].filter(Boolean).length;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filtros}>
        <View style={styles.linhaBusca}>
          <CampoTexto
            style={{ flex: 1, marginBottom: 0 }}
            placeholder="Buscar por nome, código ou local"
            value={busca}
            onChangeText={setBusca}
          />
          <Pressable onPress={() => setMostrarFiltros((v) => !v)} style={styles.botaoFiltro}>
            <Ionicons name="options-outline" size={22} color={cores.primaria} />
            {filtrosAtivos > 0 && <Text style={styles.contador}>{filtrosAtivos}</Text>}
          </Pressable>
        </View>
        {mostrarFiltros && (
          <View style={{ marginTop: 12 }}>
            <SeletorOpcoes rotulo="Status" opcoes={STATUS_EQUIPAMENTO} valor={status} onChange={setStatus} rotuloVazio="Todos" />
            <SeletorOpcoes rotulo="Categoria" opcoes={CATEGORIAS} valor={categoria} onChange={setCategoria} rotuloVazio="Todas" />
            <ControleOrdenacao opcoes={ORDENACAO_EQUIPAMENTOS} {...ordenacao} onChange={setOrdenacao} />
          </View>
        )}
      </View>

      <FlatList
        data={equipamentos}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<Text style={styles.total}>{equipamentos.length} equipamento(s)</Text>}
        ListEmptyComponent={
          <EstadoVazio
            titulo="Nenhum equipamento encontrado"
            mensagem={busca || filtrosAtivos ? 'Tente mudar a busca ou os filtros.' : 'Toque em + para cadastrar.'}
          />
        }
        renderItem={({ item: e }) => (
          <Cartao onPress={() => router.push({ pathname: '/equipamento/[id]', params: { id: e.id } })}>
            <View style={styles.cabecalho}>
              <Text style={styles.nome}>{e.nome}</Text>
              <Badge texto={e.status} cor={coresStatus[e.status]} />
            </View>
            <Text style={styles.detalhe}>{e.codigoPatrimonio}  •  {e.categoria}</Text>
            {e.localizacao ? <Text style={styles.detalhe}>📍 {e.localizacao}</Text> : null}
            <Text style={styles.detalhe}>{e.totalManutencoes} manutenção(ões) registrada(s)</Text>
          </Cartao>
        )}
      />

      <BotaoFlutuante rotulo="Cadastrar equipamento" onPress={() => router.push('/equipamento/form')} />
    </View>
  );
}

const styles = StyleSheet.create({
  filtros: { padding: 12, backgroundColor: cores.superficie, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linhaBusca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botaoFiltro: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: cores.perigo,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 9,
    minWidth: 18,
    textAlign: 'center',
    overflow: 'hidden',
  },
  lista: { padding: 12, paddingBottom: 96 },
  total: { color: cores.textoSuave, marginBottom: 8, fontSize: 13 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nome: { fontSize: 16, fontWeight: '700', color: cores.texto, flex: 1 },
  detalhe: { fontSize: 13, color: cores.textoSuave, marginTop: 4 },
});
