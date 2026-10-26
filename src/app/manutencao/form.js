import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import ManutencaoFactory from '../../models/ManutencaoFactory';
import equipamentoRepository from '../../repositories/EquipamentoRepository';
import manutencaoRepository from '../../repositories/ManutencaoRepository';
import CampoTexto, { CampoData } from '../../components/CampoTexto';
import SeletorOpcoes from '../../components/SeletorOpcoes';
import Botao from '../../components/Botao';
import { Badge, Cartao, EstadoVazio, LinhaInfo } from '../../components/Basicos';
import { STATUS_MANUTENCAO, TIPOS_MANUTENCAO } from '../../utils/constantes';
import { confirmar, mostrarErro, tratarErroFormulario } from '../../utils/alertas';
import { hojeIso, isoParaBr } from '../../utils/datas';
import { cores, coresPrioridade } from '../../utils/tema';

const formVazio = (equipamentoId) => ({
  tipo: 'Corretiva',
  equipamentoId,
  descricao: '',
  tecnico: '',
  dataAbertura: isoParaBr(hojeIso()),
  dataPrevista: '',
  dataConclusao: '',
  custo: '',
  status: 'Pendente',
  periodicidadeDias: '',
});

export default function FormManutencaoScreen() {
  const params = useLocalSearchParams();
  const id = params.id ? Number(params.id) : null;
  const equipamentoFixo = params.equipamentoId ? Number(params.equipamentoId) : null;
  const editando = id !== null;

  const [form, setForm] = useState(() => formVazio(equipamentoFixo));
  const [original, setOriginal] = useState(null);
  const [equipamentos, setEquipamentos] = useState(null);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (editando) {
          const manutencao = await manutencaoRepository.buscarPorId(id);
          setOriginal(manutencao);
          setForm(manutencao.paraFormulario());
        } else {
          setEquipamentos(await equipamentoRepository.listar({ ordenarPor: 'nome' }));
        }
      } catch (erro) {
        mostrarErro(erro);
        router.back();
      }
    })();
  }, [editando, id]);

  const alterar = (campo) => (valor) => {
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor };
      // Ao concluir, já sugere a data de hoje como data de conclusão.
      if (campo === 'status' && valor === 'Concluída' && !atual.dataConclusao) {
        novo.dataConclusao = isoParaBr(hojeIso());
      }
      return novo;
    });
    setErros(({ [campo]: _removido, ...resto }) => resto);
  };

  async function salvar() {
    setSalvando(true);
    try {
      // A fábrica cria ManutencaoPreventiva ou ManutencaoCorretiva conforme o tipo.
      const manutencao = ManutencaoFactory.deFormulario({
        ...form,
        id,
        dataConclusao: form.status === 'Concluída' ? form.dataConclusao : '',
        periodicidadeDias: form.tipo === 'Preventiva' ? form.periodicidadeDias : '',
      });
      if (editando) {
        await manutencaoRepository.atualizar(manutencao);
      } else {
        await manutencaoRepository.inserir(manutencao);
      }
      Alert.alert('Pronto', editando ? 'Manutenção atualizada.' : 'Manutenção registrada.');
      router.back();
    } catch (erro) {
      tratarErroFormulario(erro, setErros);
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    confirmar('Excluir manutenção', 'Deseja excluir este registro do histórico?', async () => {
      try {
        await manutencaoRepository.excluir(id);
        Alert.alert('Pronto', 'Manutenção excluída.');
        router.back();
      } catch (erro) {
        mostrarErro(erro);
      }
    });
  }

  if (!editando && equipamentos?.length === 0) {
    return (
      <EstadoVazio icone="cube-outline" titulo="Cadastre um equipamento primeiro"
        mensagem="Toda manutenção precisa estar ligada a um equipamento.">
        <Botao titulo="Cadastrar equipamento" icone="add" onPress={() => router.replace('/equipamento/form')} />
      </EstadoVazio>
    );
  }

  const nomeEquipamentoFixo = original?.nomeEquipamento
    ?? equipamentos?.find((e) => e.id === equipamentoFixo)?.nome;
  const prioridade = original?.getPrioridade();
  const proxima = original?.proximaManutencao();

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Stack.Screen options={{ title: editando ? 'Editar manutenção' : 'Nova manutenção' }} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {original && (
          <Cartao>
            <View style={styles.linhaBadges}>
              <Badge texto={`Prioridade: ${prioridade}`} cor={coresPrioridade[prioridade]} />
              {original.estaAtrasada && <Badge texto="ATRASADA" cor={cores.perigo} />}
            </View>
            <LinhaInfo rotulo="Registrada em" valor={isoParaBr(original.criadoEm)} />
            {proxima && <LinhaInfo rotulo="Próxima preventiva sugerida" valor={isoParaBr(proxima)} />}
          </Cartao>
        )}

        {nomeEquipamentoFixo || editando ? (
          <View style={styles.equipamentoFixo}>
            <Text style={styles.rotulo}>Equipamento</Text>
            <Text style={styles.equipamentoNome}>{nomeEquipamentoFixo}</Text>
          </View>
        ) : (
          <SeletorOpcoes
            rotulo="Equipamento"
            obrigatorio
            opcoes={(equipamentos ?? []).map((e) => ({ valor: e.id, rotulo: `${e.nome} (${e.codigoPatrimonio})` }))}
            valor={form.equipamentoId}
            onChange={alterar('equipamentoId')}
            erro={erros.equipamentoId}
          />
        )}

        <SeletorOpcoes rotulo="Tipo" obrigatorio opcoes={TIPOS_MANUTENCAO} valor={form.tipo}
          onChange={alterar('tipo')} erro={erros.tipo} />
        <Text style={styles.dica}>{ManutencaoFactory.descricaoDoTipo(form.tipo)}</Text>

        <CampoTexto rotulo={form.tipo === 'Corretiva' ? 'Defeito / serviço' : 'Serviço'} obrigatorio multiline
          value={form.descricao} onChangeText={alterar('descricao')} erro={erros.descricao}
          placeholder={form.tipo === 'Corretiva' ? 'Ex.: Não liga, disjuntor desarma' : 'Ex.: Limpeza dos filtros'} />
        <CampoTexto rotulo="Técnico responsável" obrigatorio value={form.tecnico}
          onChangeText={alterar('tecnico')} erro={erros.tecnico} />

        <View style={styles.linha}>
          <CampoData style={{ flex: 1 }} rotulo="Abertura" obrigatorio value={form.dataAbertura}
            onChangeText={alterar('dataAbertura')} erro={erros.dataAbertura} />
          <CampoData style={{ flex: 1 }} rotulo="Previsão" obrigatorio={form.tipo === 'Preventiva'}
            value={form.dataPrevista} onChangeText={alterar('dataPrevista')} erro={erros.dataPrevista} />
        </View>

        {form.tipo === 'Preventiva' && (
          <CampoTexto rotulo="Repetir a cada (dias)" value={form.periodicidadeDias}
            onChangeText={alterar('periodicidadeDias')} erro={erros.periodicidadeDias}
            keyboardType="number-pad" placeholder="Ex.: 90" />
        )}

        <SeletorOpcoes rotulo="Status" obrigatorio opcoes={STATUS_MANUTENCAO} valor={form.status}
          onChange={alterar('status')} erro={erros.status} />

        {form.status === 'Concluída' && (
          <CampoData rotulo="Data de conclusão" obrigatorio value={form.dataConclusao}
            onChangeText={alterar('dataConclusao')} erro={erros.dataConclusao} />
        )}

        <CampoTexto rotulo="Custo (R$)" value={form.custo} onChangeText={alterar('custo')}
          erro={erros.custo} keyboardType="decimal-pad" placeholder="0,00" />

        <View style={styles.acoes}>
          <Botao titulo={editando ? 'Salvar alterações' : 'Registrar'} icone="save-outline"
            onPress={salvar} carregando={salvando} />
          {editando && (
            <Botao variante="perigo" titulo="Excluir manutenção" icone="trash-outline" onPress={excluir} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 48 },
  linhaBadges: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: 4 },
  equipamentoFixo: { marginBottom: 14 },
  equipamentoNome: { fontSize: 16, color: cores.primaria, fontWeight: '700' },
  dica: { fontSize: 13, color: cores.textoSuave, marginTop: -8, marginBottom: 14, fontStyle: 'italic' },
  linha: { flexDirection: 'row', gap: 10 },
  acoes: { gap: 10, marginTop: 8 },
});
