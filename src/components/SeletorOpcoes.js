import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cores } from '../utils/tema';

// Lista horizontal de "chips". As opções podem ser textos ou { valor, rotulo }.
// Com rotuloVazio, aparece um chip extra que representa "nenhum filtro" (null).
export default function SeletorOpcoes({ rotulo, opcoes, valor, onChange, rotuloVazio, erro, obrigatorio }) {
  const itens = opcoes.map((o) => (typeof o === 'string' ? { valor: o, rotulo: o } : o));
  if (rotuloVazio) itens.unshift({ valor: null, rotulo: rotuloVazio });

  return (
    <View style={styles.container}>
      {rotulo && (
        <Text style={styles.rotulo}>
          {rotulo}
          {obrigatorio && <Text style={{ color: cores.perigo }}> *</Text>}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lista}>
        {itens.map((item) => {
          const selecionado = item.valor === valor;
          return (
            <Pressable
              key={String(item.valor)}
              onPress={() => onChange(item.valor)}
              style={[styles.chip, selecionado && styles.chipSelecionado, erro && !selecionado && styles.chipErro]}
            >
              <Text style={[styles.textoChip, selecionado && styles.textoSelecionado]}>{item.rotulo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  lista: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipErro: { borderColor: cores.perigo },
  textoChip: { color: cores.texto, fontSize: 14 },
  textoSelecionado: { color: '#fff', fontWeight: '600' },
  erro: { color: cores.perigo, fontSize: 13, marginTop: 4 },
});
