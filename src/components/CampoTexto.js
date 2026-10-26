import { StyleSheet, Text, TextInput, View } from 'react-native';
import { cores } from '../utils/tema';
import { mascaraData } from '../utils/datas';

export default function CampoTexto({ rotulo, erro, obrigatorio = false, multiline = false, style, ...props }) {
  return (
    <View style={[styles.container, style]}>
      {rotulo && (
        <Text style={styles.rotulo}>
          {rotulo}
          {obrigatorio && <Text style={styles.obrigatorio}> *</Text>}
        </Text>
      )}
      <TextInput
        placeholderTextColor={cores.neutro}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilinha, erro && styles.inputErro]}
        {...props}
      />
      {erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

export function CampoData({ value, onChangeText, ...props }) {
  return (
    <CampoTexto
      value={value}
      onChangeText={(texto) => onChangeText(mascaraData(texto))}
      placeholder="DD/MM/AAAA"
      keyboardType="number-pad"
      maxLength={10}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  obrigatorio: { color: cores.perigo },
  input: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: cores.texto,
  },
  multilinha: { minHeight: 90, textAlignVertical: 'top' },
  inputErro: { borderColor: cores.perigo, borderWidth: 1.5 },
  erro: { color: cores.perigo, fontSize: 13, marginTop: 4 },
});
