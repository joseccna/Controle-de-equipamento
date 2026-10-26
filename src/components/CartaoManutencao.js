import { StyleSheet, Text, View } from 'react-native';
import { Badge, Cartao } from './Basicos';
import { cores, coresPrioridade, coresStatus } from '../utils/tema';
import { isoParaBr } from '../utils/datas';
import { formatarMoeda } from '../utils/numeros';

export default function CartaoManutencao({ manutencao: m, onPress, mostrarEquipamento = true }) {
  // getPrioridade() é polimórfico: cada subclasse calcula do seu jeito.
  const prioridade = m.getPrioridade();
  return (
    <Cartao onPress={onPress} style={m.estaAtrasada && styles.atrasada}>
      <View style={styles.topo}>
        <Badge texto={m.tipo} cor={m.tipo === 'Corretiva' ? cores.perigo : cores.info} />
        <Badge texto={`Prioridade: ${prioridade}`} cor={coresPrioridade[prioridade]} />
        {m.estaAtrasada && <Badge texto="ATRASADA" cor={cores.perigo} />}
      </View>
      {mostrarEquipamento && <Text style={styles.equipamento}>{m.nomeEquipamento}</Text>}
      <Text style={styles.descricao} numberOfLines={2}>{m.descricao}</Text>
      <Text style={styles.detalhe}>Técnico: {m.tecnico}</Text>
      <View style={styles.rodape}>
        <Text style={styles.detalhe}>
          Abertura {isoParaBr(m.dataAbertura)}
          {m.dataPrevista ? `  •  Previsão ${isoParaBr(m.dataPrevista)}` : ''}
        </Text>
      </View>
      <View style={styles.rodape}>
        <Badge texto={m.status} cor={coresStatus[m.status]} />
        <Text style={styles.custo}>{formatarMoeda(m.custo)}</Text>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  atrasada: { borderColor: cores.perigo, borderLeftWidth: 4 },
  topo: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  equipamento: { fontSize: 16, fontWeight: '700', color: cores.texto },
  descricao: { fontSize: 14, color: cores.texto, marginTop: 2 },
  detalhe: { fontSize: 13, color: cores.textoSuave, marginTop: 4 },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  custo: { fontSize: 15, fontWeight: '700', color: cores.texto },
});
