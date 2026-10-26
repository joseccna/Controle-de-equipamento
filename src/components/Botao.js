import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cores } from '../utils/tema';

const VARIANTES = {
  primario: { fundo: cores.primaria, texto: '#fff', borda: cores.primaria },
  secundario: { fundo: cores.superficie, texto: cores.primaria, borda: cores.primaria },
  perigo: { fundo: cores.superficie, texto: cores.perigo, borda: cores.perigo },
};

export default function Botao({ titulo, onPress, variante = 'primario', icone, carregando = false, style }) {
  const v = VARIANTES[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: v.fundo, borderColor: v.borda, opacity: pressed || carregando ? 0.7 : 1 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={18} color={v.texto} />}
          <Text style={[styles.texto, { color: v.texto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 48,
  },
  texto: { fontSize: 15, fontWeight: '600' },
});
