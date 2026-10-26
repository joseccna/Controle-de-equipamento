import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Equipamento from '../../models/Equipamento';
import equipamentoRepository from '../../repositories/EquipamentoRepository';
import CampoTexto, { CampoData } from '../../components/CampoTexto';
import SeletorOpcoes from '../../components/SeletorOpcoes';
import Botao from '../../components/Botao';
import { CATEGORIAS, STATUS_EQUIPAMENTO } from '../../utils/constantes';
import { mostrarErro, tratarErroFormulario } from '../../utils/alertas';
import { cores } from '../../utils/tema';

const FORM_VAZIO = {
  nome: '',
  codigoPatrimonio: '',
  categoria: null,
  marca: '',
  modelo: '',
  localizacao: '',
  dataAquisicao: '',
  status: 'Ativo',
};

export default function FormEquipamentoScreen() {
  const { id } = useLocalSearchParams();
  const editando = Boolean(id);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    (async () => {
      try {
        const equipamento = await equipamentoRepository.buscarPorId(Number(id));
        setForm(equipamento.paraFormulario());
      } catch (erro) {
        mostrarErro(erro);
        router.back();
      }
    })();
  }, [editando, id]);

  // Atualiza o campo e apaga o erro dele, se houver.
  const alterar = (campo) => (valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros(({ [campo]: _removido, ...resto }) => resto);
  };

  async function salvar() {
    setSalvando(true);
    try {
      const equipamento = Equipamento.deFormulario({ ...form, id: editando ? Number(id) : null });
      if (editando) {
        await equipamentoRepository.atualizar(equipamento);
      } else {
        await equipamentoRepository.inserir(equipamento);
      }
      Alert.alert('Pronto', editando ? 'Equipamento atualizado.' : 'Equipamento cadastrado.');
      router.back();
    } catch (erro) {
      tratarErroFormulario(erro, setErros);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Stack.Screen options={{ title: editando ? 'Editar equipamento' : 'Novo equipamento' }} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.aviso}>Campos com * são obrigatórios.</Text>

        <CampoTexto rotulo="Nome" obrigatorio value={form.nome} onChangeText={alterar('nome')}
          erro={erros.nome} placeholder="Ex.: Ar-condicionado sala 3" />
        <CampoTexto rotulo="Código de patrimônio" obrigatorio value={form.codigoPatrimonio}
          onChangeText={alterar('codigoPatrimonio')} erro={erros.codigoPatrimonio}
          placeholder="Ex.: PAT-0001" autoCapitalize="characters" />
        <SeletorOpcoes rotulo="Categoria" obrigatorio opcoes={CATEGORIAS} valor={form.categoria}
          onChange={alterar('categoria')} erro={erros.categoria} />
        <CampoTexto rotulo="Marca" value={form.marca} onChangeText={alterar('marca')} erro={erros.marca} />
        <CampoTexto rotulo="Modelo" value={form.modelo} onChangeText={alterar('modelo')} erro={erros.modelo} />
        <CampoTexto rotulo="Localização" value={form.localizacao} onChangeText={alterar('localizacao')}
          erro={erros.localizacao} placeholder="Ex.: Bloco B, sala 12" />
        <CampoData rotulo="Data de aquisição" value={form.dataAquisicao}
          onChangeText={alterar('dataAquisicao')} erro={erros.dataAquisicao} />
        <SeletorOpcoes rotulo="Status" obrigatorio opcoes={STATUS_EQUIPAMENTO} valor={form.status}
          onChange={alterar('status')} erro={erros.status} />

        <Botao titulo={editando ? 'Salvar alterações' : 'Cadastrar'} icone="save-outline"
          onPress={salvar} carregando={salvando} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 48 },
  aviso: { color: cores.textoSuave, fontSize: 13, marginBottom: 12 },
});
