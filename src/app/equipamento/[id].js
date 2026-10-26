import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import equipamentoRepository from '../../repositories/EquipamentoRepository';
import manutencaoRepository from '../../repositories/ManutencaoRepository';
import RegistroNaoEncontradoError from '../../errors/RegistroNaoEncontradoError';
import CartaoManutencao from '../../components/CartaoManutencao';
import Botao from '../../components/Botao';
import { Badge, Cartao, EstadoVazio, LinhaInfo, TituloSecao } from '../../components/Basicos';
import { confirmar, mostrarErro } from '../../utils/alertas';
import { isoParaBr } from '../../utils/datas';
import { formatarMoeda } from '../../utils/numeros';
import { cores, coresStatus } from '../../utils/tema';

export default function DetalheEquipamentoScreen() {
  const id = Number(useLocalSearchParams().id);
  const [equipamento, setEquipamento] = useState(null);
  const [historico, setHistorico] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const [e, h] = await Promise.all([
        equipamentoRepository.buscarPorId(id),
        manutencaoRepository.listar({ equipamentoId: id, ordenarPor: 'abertura', crescente: false }),
      ]);
      setEquipamento(e);
      setHistorico(h);
    } catch (erro) {
      mostrarErro(erro);
      if (erro instanceof RegistroNaoEncontradoError) router.back();
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Usa o setter da classe (encapsulamento): ele valida o novo status.
  async function alternarAtivo() {
    try {
      equipamento.status = equipamento.estaInativo ? 'Ativo' : 'Inativo';
      await equipamentoRepository.atualizar(equipamento);
      await carregar();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  function excluir() {
    const aviso = historico.length
      ? `\n\nAs ${historico.length} manutenção(ões) do histórico também serão excluídas.`
      : '';
    confirmar('Excluir equipamento', `Deseja excluir "${equipamento.nome}"?${aviso}`, async () => {
      try {
        await equipamentoRepository.excluir(id);
        Alert.alert('Pronto', 'Equipamento excluído.');
        router.back();
      } catch (erro) {
        mostrarErro(erro);
      }
    });
  }

  if (!equipamento) return null;
  const e = equipamento;
  const custoTotal = historico.filter((m) => m.status === 'Concluída').reduce((s, m) => s + m.custo, 0);
  const abertas = historico.filter((m) => m.estaAberta).length;

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Stack.Screen options={{ title: e.nome }} />

      <Cartao>
        <View style={styles.cabecalho}>
          <Text style={styles.nome}>{e.nome}</Text>
          <Badge texto={e.status} cor={coresStatus[e.status]} />
        </View>
        <LinhaInfo rotulo="Código de patrimônio" valor={e.codigoPatrimonio} />
        <LinhaInfo rotulo="Categoria" valor={e.categoria} />
        <LinhaInfo rotulo="Marca / Modelo" valor={[e.marca, e.modelo].filter(Boolean).join(' / ')} />
        <LinhaInfo rotulo="Localização" valor={e.localizacao} />
        <LinhaInfo rotulo="Data de aquisição" valor={isoParaBr(e.dataAquisicao)} />
        <LinhaInfo rotulo="Cadastrado em" valor={isoParaBr(e.criadoEm)} />
      </Cartao>

      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoValor}>{historico.length}</Text>
          <Text style={styles.resumoRotulo}>Manutenções</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={[styles.resumoValor, { color: cores.alerta }]}>{abertas}</Text>
          <Text style={styles.resumoRotulo}>Em aberto</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={[styles.resumoValor, { fontSize: 16 }]}>{formatarMoeda(custoTotal)}</Text>
          <Text style={styles.resumoRotulo}>Gasto total</Text>
        </View>
      </View>

      <View style={styles.acoes}>
        <Botao
          titulo="Registrar manutenção"
          icone="construct-outline"
          onPress={() => router.push({ pathname: '/manutencao/form', params: { equipamentoId: id } })}
        />
        <View style={styles.linhaBotoes}>
          <Botao style={{ flex: 1 }} variante="secundario" titulo="Editar" icone="create-outline"
            onPress={() => router.push({ pathname: '/equipamento/form', params: { id } })} />
          <Botao style={{ flex: 1 }} variante="secundario" titulo={e.estaInativo ? 'Reativar' : 'Desativar'}
            icone={e.estaInativo ? 'play-outline' : 'pause-outline'} onPress={alternarAtivo} />
        </View>
        <Botao variante="perigo" titulo="Excluir equipamento" icone="trash-outline" onPress={excluir} />
      </View>

      <TituloSecao>Histórico de manutenções</TituloSecao>
      {historico.length === 0 ? (
        <EstadoVazio icone="construct-outline" titulo="Nenhuma manutenção registrada" />
      ) : (
        historico.map((m) => (
          <CartaoManutencao
            key={m.id}
            manutencao={m}
            mostrarEquipamento={false}
            onPress={() => router.push({ pathname: '/manutencao/form', params: { id: m.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 32 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  nome: { fontSize: 19, fontWeight: '800', color: cores.texto, flex: 1 },
  resumo: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  resumoItem: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 12,
    alignItems: 'center',
  },
  resumoValor: { fontSize: 22, fontWeight: '800', color: cores.primaria },
  resumoRotulo: { fontSize: 12, color: cores.textoSuave, marginTop: 2 },
  acoes: { gap: 10 },
  linhaBotoes: { flexDirection: 'row', gap: 10 },
});
