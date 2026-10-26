import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import manutencaoRepository from '../../repositories/ManutencaoRepository';
import CampoTexto from '../../components/CampoTexto';
import SeletorOpcoes from '../../components/SeletorOpcoes';
import ControleOrdenacao from '../../components/ControleOrdenacao';
import CartaoManutencao from '../../components/CartaoManutencao';
import { BotaoFlutuante, EstadoVazio } from '../../components/Basicos';
import { ORDENACAO_MANUTENCOES, SITUACOES_MANUTENCAO, TIPOS_MANUTENCAO } from '../../utils/constantes';
import { mostrarErro } from '../../utils/alertas';
import { formatarMoeda } from '../../utils/numeros';
import { cores } from '../../utils/tema';

export default function ManutencoesScreen() {
  const params = useLocalSearchParams();
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [ordenacao, setOrdenacao] = useState({ ordenarPor: 'abertura', crescente: false });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [manutencoes, setManutencoes] = useState([]);

  // O painel pode abrir esta tela já filtrada (ex.: só as atrasadas).
  useEffect(() => {
    if (params.situacao) {
      setSituacao(params.situacao);
      setMostrarFiltros(true);
      router.setParams({ situacao: '' }); // permite aplicar o mesmo filtro de novo depois
    }
  }, [params.situacao]);

  const carregar = useCallback(async () => {
    try {
      setManutencoes(await manutencaoRepository.listar({ busca, situacao, tipo, ...ordenacao }));
    } catch (erro) {
      mostrarErro(erro);
    }
  }, [busca, situacao, tipo, ordenacao]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const filtrosAtivos = [situacao, tipo].filter(Boolean).length;
  const custoTotal = manutencoes.reduce((soma, m) => soma + m.custo, 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filtros}>
        <View style={styles.linhaBusca}>
          <CampoTexto
            style={{ flex: 1, marginBottom: 0 }}
            placeholder="Buscar por serviço, técnico ou equipamento"
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
            <SeletorOpcoes rotulo="Situação" opcoes={SITUACOES_MANUTENCAO} valor={situacao} onChange={setSituacao} rotuloVazio="Todas" />
            <SeletorOpcoes rotulo="Tipo" opcoes={TIPOS_MANUTENCAO} valor={tipo} onChange={setTipo} rotuloVazio="Todos" />
            <ControleOrdenacao opcoes={ORDENACAO_MANUTENCOES} {...ordenacao} onChange={setOrdenacao} />
          </View>
        )}
      </View>

      <FlatList
        data={manutencoes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <Text style={styles.total}>
            {manutencoes.length} manutenção(ões)  •  {formatarMoeda(custoTotal)}
          </Text>
        }
        ListEmptyComponent={
          <EstadoVazio
            icone="construct-outline"
            titulo="Nenhuma manutenção encontrada"
            mensagem={busca || filtrosAtivos ? 'Tente mudar a busca ou os filtros.' : 'Toque em + para registrar.'}
          />
        }
        renderItem={({ item }) => (
          <CartaoManutencao
            manutencao={item}
            onPress={() => router.push({ pathname: '/manutencao/form', params: { id: item.id } })}
          />
        )}
      />

      <BotaoFlutuante rotulo="Registrar manutenção" onPress={() => router.push('/manutencao/form')} />
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
});
