import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cores } from '../utils/tema';

export function Badge({ texto, cor = cores.neutro }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${cor}1A`, borderColor: cor }]}>
      <Text style={[styles.badgeTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Cartao({ children, onPress, style }) {
  if (!onPress) return <View style={[styles.cartao, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.8 }, style]}>
      {children}
    </Pressable>
  );
}

export function EstadoVazio({ icone = 'file-tray-outline', titulo, mensagem, children }) {
  return (
    <View style={styles.vazio}>
      <Ionicons name={icone} size={48} color={cores.neutro} />
      <Text style={styles.vazioTitulo}>{titulo}</Text>
      {mensagem && <Text style={styles.vazioMensagem}>{mensagem}</Text>}
      {children}
    </View>
  );
}

export function BotaoFlutuante({ onPress, icone = 'add', rotulo }) {
  return (
    <Pressable
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icone} size={28} color="#fff" />
    </Pressable>
  );
}

export function LinhaInfo({ rotulo, valor }) {
  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor || '—'}</Text>
    </View>
  );
}

export function TituloSecao({ children }) {
  return <Text style={styles.tituloSecao}>{children}</Text>;
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  vazio: { alignItems: 'center', padding: 32, gap: 8 },
  vazioTitulo: { fontSize: 17, fontWeight: '600', color: cores.texto, textAlign: 'center' },
  vazioMensagem: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', marginBottom: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.borda,
    gap: 12,
  },
  linhaRotulo: { color: cores.textoSuave, fontSize: 14 },
  linhaValor: { color: cores.texto, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  tituloSecao: { fontSize: 17, fontWeight: '700', color: cores.texto, marginTop: 16, marginBottom: 10 },
});
