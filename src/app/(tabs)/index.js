import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import equipamentoRepository from '../../repositories/EquipamentoRepository';
import manutencaoRepository from '../../repositories/ManutencaoRepository';
import CartaoManutencao from '../../components/CartaoManutencao';
import Botao from '../../components/Botao';
import { EstadoVazio, TituloSecao } from '../../components/Basicos';
import { mostrarErro } from '../../utils/alertas';
import { definirFiltroPendente } from '../../utils/filtroPendente';
import { formatarMoeda } from '../../utils/numeros';
import { cores } from '../../utils/tema';

function Indicador({ titulo, valor, icone, cor, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.indicador, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icone} size={22} color={cor} />
      <Text style={[styles.indicadorValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.indicadorTitulo}>{titulo}</Text>
    </Pressable>
  );
}

// null = sem filtro (mostrar todos).
function verEquipamentos(status) {
  definirFiltroPendente('equipamentos', status);
  router.navigate('/equipamentos');
}

function verManutencoes(situacao) {
  definirFiltroPendente('manutencoes', situacao);
  router.navigate('/manutencoes');
}

export default function PainelScreen() {
  const [dados, setDados] = useState(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [equipamentos, manutencoes, proximas] = await Promise.all([
        equipamentoRepository.resumo(),
        manutencaoRepository.resumo(),
        manutencaoRepository.listar({ situacao: 'abertas', ordenarPor: 'prevista', crescente: true, limite: 5 }),
      ]);
      setDados({ equipamentos, manutencoes, proximas });
    } catch (erro) {
      mostrarErro(erro);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if (!dados) return null;
  const { equipamentos: eq, manutencoes: mn, proximas } = dados;

  if (eq.total === 0) {
    return (
      <EstadoVazio
        icone="cube-outline"
        titulo="Nenhum equipamento cadastrado"
        mensagem="Cadastre o primeiro equipamento para começar a registrar manutenções."
      >
        <Botao titulo="Cadastrar equipamento" icone="add" onPress={() => router.push('/equipamento/form')} />
      </EstadoVazio>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} />}
    >
      <TituloSecao>Equipamentos</TituloSecao>
      <View style={styles.grade}>
        <Indicador titulo="Total" valor={eq.total} icone="cube-outline" cor={cores.primaria}
          onPress={() => verEquipamentos(null)} />
        <Indicador titulo="Ativos" valor={eq.ativos} icone="checkmark-circle-outline" cor={cores.sucesso}
          onPress={() => verEquipamentos('Ativo')} />
        <Indicador titulo="Em manutenção" valor={eq.emManutencao} icone="build-outline" cor={cores.alerta}
          onPress={() => verEquipamentos('Em manutenção')} />
        <Indicador titulo="Inativos" valor={eq.inativos} icone="pause-circle-outline" cor={cores.neutro}
          onPress={() => verEquipamentos('Inativo')} />
      </View>

      <TituloSecao>Manutenções</TituloSecao>
      <View style={styles.grade}>
        <Indicador titulo="Pendentes" valor={mn.pendentes} icone="time-outline" cor={cores.info}
          onPress={() => verManutencoes('Pendente')} />
        <Indicador titulo="Em andamento" valor={mn.emAndamento} icone="hammer-outline" cor={cores.alerta}
          onPress={() => verManutencoes('Em andamento')} />
        <Indicador titulo="Atrasadas" valor={mn.atrasadas} icone="alert-circle-outline" cor={cores.perigo}
          onPress={() => verManutencoes('atrasadas')} />
        <Indicador titulo="Concluídas" valor={mn.concluidas} icone="checkmark-done-outline" cor={cores.sucesso}
          onPress={() => verManutencoes('Concluída')} />
      </View>
      <View style={styles.custo}>
        <Text style={styles.custoRotulo}>Custo total das manutenções concluídas</Text>
        <Text style={styles.custoValor}>{formatarMoeda(mn.custoConcluidas)}</Text>
      </View>

      <TituloSecao>Próximos serviços</TituloSecao>
      {proximas.length === 0 ? (
        <Text style={styles.semItens}>Nenhuma manutenção em aberto. 🎉</Text>
      ) : (
        proximas.map((m) => (
          <CartaoManutencao
            key={m.id}
            manutencao={m}
            onPress={() => router.push({ pathname: '/manutencao/form', params: { id: m.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 32 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  indicador: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: cores.superficie,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 4,
  },
  indicadorValor: { fontSize: 26, fontWeight: '800' },
  indicadorTitulo: { fontSize: 13, color: cores.textoSuave },
  custo: {
    marginTop: 10,
    backgroundColor: cores.primariaClara,
    borderRadius: 10,
    padding: 14,
  },
  custoRotulo: { fontSize: 13, color: cores.textoSuave },
  custoValor: { fontSize: 22, fontWeight: '800', color: cores.primaria, marginTop: 4 },
  semItens: { color: cores.textoSuave, fontSize: 14 },
});
