import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import SeletorOpcoes from './SeletorOpcoes';
import { cores } from '../utils/tema';

export default function ControleOrdenacao({ opcoes, ordenarPor, crescente, onChange }) {
  return (
    <View style={styles.linha}>
      <View style={{ flex: 1 }}>
        <SeletorOpcoes
          rotulo="Ordenar por"
          opcoes={opcoes}
          valor={ordenarPor}
          onChange={(valor) => onChange({ ordenarPor: valor, crescente })}
        />
      </View>
      <Pressable
        accessibilityLabel={crescente ? 'Ordem crescente' : 'Ordem decrescente'}
        onPress={() => onChange({ ordenarPor, crescente: !crescente })}
        style={styles.direcao}
      >
        <Ionicons name={crescente ? 'arrow-up' : 'arrow-down'} size={20} color={cores.primaria} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  direcao: {
    marginBottom: 14,
    width: 40,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
});
