import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cores } from '../../utils/tema';

const icone = (nome) => ({ color, size }) => <Ionicons name={nome} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: '#fff',
        tabBarActiveTintColor: cores.primaria,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: icone('speedometer-outline') }} />
      <Tabs.Screen name="equipamentos" options={{ title: 'Equipamentos', tabBarIcon: icone('cube-outline') }} />
      <Tabs.Screen name="manutencoes" options={{ title: 'Manutenções', tabBarIcon: icone('construct-outline') }} />
    </Tabs>
  );
}
