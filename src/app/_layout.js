import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Database from '../database/Database';
import Botao from '../components/Botao';
import { cores } from '../utils/tema';

export default function RootLayout() {
  const [estado, setEstado] = useState({ pronto: false, erro: null });

  // Abre o banco (e cria as tabelas na primeira execução) antes de mostrar o app.
  const iniciar = useCallback(async () => {
    setEstado({ pronto: false, erro: null });
    try {
      await Database.obter();
      setEstado({ pronto: true, erro: null });
    } catch (erro) {
      setEstado({ pronto: false, erro });
    }
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  if (estado.erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erroTitulo}>Falha ao iniciar</Text>
        <Text style={styles.erroTexto}>{estado.erro.message}</Text>
        <Botao titulo="Tentar novamente" icone="refresh" onPress={iniciar} />
      </View>
    );
  }

  if (!estado.pronto) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.primaria },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="equipamento/[id]" options={{ title: 'Equipamento' }} />
        <Stack.Screen name="equipamento/form" options={{ title: 'Equipamento' }} />
        <Stack.Screen name="manutencao/form" options={{ title: 'Manutenção' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: cores.fundo },
  erroTitulo: { fontSize: 20, fontWeight: '700', color: cores.perigo },
  erroTexto: { fontSize: 15, color: cores.texto, textAlign: 'center' },
});
