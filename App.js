import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, StatusBar, View, Text, FlatList,
  TouchableOpacity, Modal, ScrollView, TextInput,
  StyleSheet, Dimensions, Alert, Image, KeyboardAvoidingView, Platform,
  PanResponder
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from './src/services/api';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2; 

export default function App() {
  const [jogos, setJogos] = useState([]);
  const [abaAtual, setAbaAtual] = useState('biblioteca'); // 'biblioteca' ou 'lixeira'
  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalFormulario, setModalFormulario] = useState(false);
  const [editando, setEditando] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [generosArray, setGenerosArray] = useState([]);
  const [generoInput, setGeneroInput] = useState('');
  const [descricao, setDescricao] = useState('');
  const [avaliacao, setAvaliacao] = useState('');

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50 && gestureState.vy > 0.3) {
        setModalDetalhes(false);
        setModalFormulario(false);
      }
    },
  });

  const carregar = async () => {
    try {
      const { data } = await api.get('/jogos');
      setJogos(data);
    } catch(e) {
  console.log("Erro completo:", e.response ? e.response.data : e.message);
  Alert.alert('Erro', 'Verifique o console do VS Code.');
}
  };

  useEffect(() => { carregar(); }, []);

  const jogosAtivos = jogos.filter(j => j.status !== 'apagado');
  const jogosApagados = jogos.filter(j => j.status === 'apagado');

  const abrirAdicionar = () => {
    setEditando(false);
    setTitulo(''); setGenerosArray([]); setGeneroInput(''); setDescricao(''); setAvaliacao('');
    setModalFormulario(true);
  };

  const abrirEditar = () => {
    setEditando(true);
    setTitulo(jogoSelecionado.titulo);
    
    let parsedGeneros = [];
    try {
      if (typeof jogoSelecionado.genero === 'string' && jogoSelecionado.genero.startsWith('[')) {
        parsedGeneros = JSON.parse(jogoSelecionado.genero);
      } else if (typeof jogoSelecionado.genero === 'string') {
        parsedGeneros = jogoSelecionado.genero.split(',').map(g => g.trim());
      } else if (Array.isArray(jogoSelecionado.genero)) {
        parsedGeneros = jogoSelecionado.genero;
      }
    } catch (e) {
      parsedGeneros = [jogoSelecionado.genero];
    }
    
    setGenerosArray(parsedGeneros.filter(g => g !== ''));
    setGeneroInput('');
    setDescricao(jogoSelecionado.descricao ?? '');
    setAvaliacao(String(jogoSelecionado.avaliacao || ''));
    
    setModalDetalhes(false);
    setTimeout(() => setModalFormulario(true), 350); 
  };

  const salvar = async () => {
    let tagsFinais = [...generosArray];
    if (generoInput.trim() !== '') {
      tagsFinais.push(generoInput.trim());
    }

    if (!titulo.trim() || tagsFinais.length === 0) {
      return Alert.alert('Aviso', 'Os campos Título e Gêneros são obrigatórios.');
    }
    
    const formData = new FormData();
    formData.append('titulo', titulo.trim());
    formData.append('genero', JSON.stringify(tagsFinais));
    formData.append('descricao', descricao.trim());
    formData.append('avaliacao', avaliacao ? String(avaliacao) : '0');
    formData.append('status', 'ativo'); 
    
    try {
      if (editando) {
        await api.put(`/jogos/${jogoSelecionado.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/jogos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModalFormulario(false);
      carregar();
    } catch (e) { 
      Alert.alert('Erro', 'Falha ao salvar os dados.');
    }
  };

  const moverParaLixeira = () => {
    Alert.alert('Mover para Lixeira', `Deseja enviar "${jogoSelecionado?.titulo}" para a lixeira?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Mover', style: 'destructive', onPress: async () => { 
          try {
            const formData = new FormData();
            formData.append('status', 'apagado');
            await api.put(`/jogos/${jogoSelecionado.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setModalDetalhes(false); 
            carregar(); 
          } catch(e) {
            Alert.alert('Erro', 'Não foi possível mover para a lixeira.');
          }
        } 
      }
    ]);
  };

  const recuperarJogo = async () => {
    try {
      const formData = new FormData();
      formData.append('status', 'ativo');
      await api.put(`/jogos/${jogoSelecionado.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModalDetalhes(false); 
      carregar(); 
    } catch(e) {
      Alert.alert('Erro', 'Não foi possível recuperar o jogo.');
    }
  };

  const apagarDefinitivamente = () => {
    Alert.alert('Apagar Definitivamente', `Esta ação não pode ser desfeita. Excluir "${jogoSelecionado?.titulo}" permanentemente?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { 
          try {
            await api.delete(`/jogos/${jogoSelecionado.id}`); 
            setModalDetalhes(false); 
            carregar(); 
          } catch(e) {
            Alert.alert('Erro', 'Não foi possível excluir o jogo definitivamente.');
          }
        } 
      }
    ]);
  };

  const handleGeneroChange = (text) => {
    if (text.includes(',') || text.includes(' ')) {
      const newTag = text.replace(/[, ]/g, '').trim();
      if (newTag && !generosArray.includes(newTag)) {
        setGenerosArray([...generosArray, newTag]);
      }
      setGeneroInput('');
    } else {
      setGeneroInput(text);
    }
  };

  const removerTag = (tagRemover) => {
    setGenerosArray(generosArray.filter(t => t !== tagRemover));
  };

  const renderTagsVisuais = (generoData) => {
    let lista = [];
    try {
      if (typeof generoData === 'string' && generoData.startsWith('[')) lista = JSON.parse(generoData);
      else if (typeof generoData === 'string') lista = generoData.split(',').map(g => g.trim());
      else if (Array.isArray(generoData)) lista = generoData;
    } catch (e) { lista = [generoData]; }
    
    lista = lista.filter(item => item !== '');
    if (lista.length === 0) return null;

    return (
      <View style={styles.tagsContainer}>
        {lista.map((item, index) => (
          <View key={index} style={styles.tagBadge}>
            <Text style={styles.tagText} numberOfLines={1}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => { setJogoSelecionado(item); setModalDetalhes(true); }}>
      <View style={styles.cardImageContainer}>
        {item.foto ? (
          <Image source={{ uri: `http://192.168.1.52:3000/uploads/${item.foto}` }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <Text style={styles.cardNoImageText}>Sem Capa</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
        {renderTagsVisuais(item.genero)}
        <View style={styles.cardFooter}>
          {Boolean(item.avaliacao) && Number(item.avaliacao) > 0 && (
            <Text style={styles.cardRating}>Nota: {item.avaliacao}/5</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header Centralizado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Jogos</Text>
      </View>

      {/* Navegação por Abas com Ícones Centralizados */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setAbaAtual('biblioteca')}>
          <MaterialIcons name="shelves" size={32} color={abaAtual === 'biblioteca' ? '#6366F1' : '#4B5563'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setAbaAtual('lixeira')}>
          <MaterialIcons name="delete-outline" size={32} color={abaAtual === 'lixeira' ? '#EF4444' : '#4B5563'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={abaAtual === 'biblioteca' ? jogosAtivos : jogosApagados}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        numColumns={2} 
        columnWrapperStyle={styles.listRow} 
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{abaAtual === 'biblioteca' ? 'Nenhum jogo na biblioteca' : 'Lixeira vazia'}</Text>
            <Text style={styles.emptyStateDesc}>
              {abaAtual === 'biblioteca' ? 'Comece a montar sua biblioteca adicionando seu primeiro jogo.' : 'Não há jogos excluídos recentemente.'}
            </Text>
          </View>
        }
      />

      {/* Botão FAB no canto inferior direito */}
      <TouchableOpacity style={styles.fab} onPress={abrirAdicionar} activeOpacity={0.8}>
        <MaterialIcons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MODAL DE DETALHES */}
      <Modal visible={modalDetalhes} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalDetalhes(false)} />
          <View style={styles.bottomSheet}>
            <View {...panResponder.panHandlers} style={styles.sheetHeader}>
              <View style={styles.headerPlaceholder} />
              <View style={styles.dragHandle} />
              <TouchableOpacity onPress={() => setModalDetalhes(false)} style={styles.closeButton} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>
              <Text style={styles.detailTitle}>{jogoSelecionado?.titulo}</Text>
              {renderTagsVisuais(jogoSelecionado?.genero)}
              {Boolean(jogoSelecionado?.avaliacao) && Number(jogoSelecionado?.avaliacao) > 0 && (
                <Text style={styles.detailRating}>Avaliação: {jogoSelecionado.avaliacao}/5</Text>
              )}
              
              <View style={styles.divider} />
              
              <Text style={styles.sectionLabel}>Descrição e Experiência</Text>
              <Text style={styles.detailDesc}>{jogoSelecionado?.descricao || "Nenhuma descrição adicionada para este jogo."}</Text>
              
              {abaAtual === 'biblioteca' ? (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.editBtn} onPress={abrirEditar} activeOpacity={0.8}>
                    <Text style={styles.editBtnText}>Editar Jogo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={moverParaLixeira} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.restoreBtn} onPress={recuperarJogo} activeOpacity={0.8}>
                    <Text style={styles.restoreBtnText}>Recuperar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={apagarDefinitivamente} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>Apagar de vez</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE FORMULÁRIO */}
      <Modal visible={modalFormulario} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalFormulario(false)} />
          <View style={styles.bottomSheet}>
            
            <View {...panResponder.panHandlers} style={styles.sheetHeader}>
              <View style={styles.headerPlaceholder} />
              <View style={styles.dragHandle} />
              <TouchableOpacity onPress={() => setModalFormulario(false)} style={styles.closeButton} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetScrollContentForm}>
              <Text style={styles.formMainTitle}>{editando ? 'Editar Jogo' : 'Novo Jogo'}</Text>
              
              <Text style={styles.inputLabel}>Título do Jogo</Text>
              <TextInput style={styles.inputField} value={titulo} onChangeText={setTitulo} placeholder="Ex: The Legend of Zelda" placeholderTextColor="#6B7280"/>
              
              <Text style={styles.inputLabel}>Gêneros</Text>
              <View style={styles.tagsInputContainer}>
                <TextInput 
                  style={styles.inputFieldTag} 
                  value={generoInput} 
                  onChangeText={handleGeneroChange} 
                  onSubmitEditing={() => {
                    if (generoInput.trim()) {
                      if (!generosArray.includes(generoInput.trim())) setGenerosArray([...generosArray, generoInput.trim()]);
                      setGeneroInput('');
                    }
                  }}
                  placeholder="Digite e aperte espaço..." 
                  placeholderTextColor="#6B7280"
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.formTagsContainer}>
                {generosArray.map((tag, index) => (
                  <TouchableOpacity key={index} style={styles.tagBadgeForm} onPress={() => removerTag(tag)}>
                    <Text style={styles.tagTextForm}>{tag}  ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Sua Avaliação (1 a 5)</Text>
              <TextInput style={styles.inputField} value={avaliacao} onChangeText={(val) => setAvaliacao(val.replace(/[^0-5]/g, ''))} placeholder="Ex: 5" keyboardType="numeric" maxLength={1} placeholderTextColor="#6B7280"/>

              <Text style={styles.inputLabel}>Descrição da Experiência</Text>
              <TextInput style={[styles.inputField, styles.textArea]} value={descricao} onChangeText={setDescricao} placeholder="O que você achou do jogo? Tem alguma lembrança marcante?" placeholderTextColor="#6B7280" multiline textAlignVertical="top" />
              
              <View style={styles.divider} />
            </ScrollView>

            <View style={styles.stickyFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={salvar} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>{editando ? 'Salvar Alterações' : 'Adicionar à Biblioteca'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { alignItems: 'center', paddingVertical: 20 },
  headerTitle: { color: '#F9FAFB', fontSize: 26, fontWeight: '800' },
  headerSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 2 },
  
  // Abas
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 60, marginBottom: 16 },
  tabBtn: { padding: 10 },
  
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  listRow: { justifyContent: 'space-between', marginBottom: 16 }, 
  card: { width: CARD_SIZE, height: CARD_SIZE * 1.5, backgroundColor: '#1F2937', borderRadius: 16, overflow: 'hidden' },
  cardImageContainer: { width: '100%', height: CARD_SIZE * 0.85, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardNoImageText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  cardContent: { padding: 12, flex: 1, overflow: 'hidden' },
  cardTitle: { color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardRating: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  cardFooter: { position: 'absolute', bottom: 12, left: 12 },
  
  // FAB
  fab: { position: 'absolute', right: 25, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 10 },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2, overflow: 'hidden', maxHeight: 45 },
  tagBadge: { backgroundColor: '#374151', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: '#D1D5DB', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyStateTitle: { color: '#F9FAFB', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyStateDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  bottomSheet: { backgroundColor: '#1F2937', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '90%', width: '100%' },
  
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerPlaceholder: { width: 32 }, 
  dragHandle: { width: 44, height: 5, backgroundColor: '#4B5563', borderRadius: 4 },
  closeButton: { width: 32, height: 32, alignItems: 'flex-end', justifyContent: 'center' },
  closeIcon: { color: '#9CA3AF', fontSize: 20, fontWeight: '800' },
  
  sheetScrollContent: { paddingHorizontal: 24, paddingBottom: 80 },
  sheetScrollContentForm: { paddingHorizontal: 24, paddingBottom: 24 },
  
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 24 },
  sectionLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

  detailTitle: { color: '#F9FAFB', fontSize: 26, fontWeight: '800', marginBottom: 12, marginTop: 8 },
  detailRating: { color: '#F3F4F6', fontSize: 16, fontWeight: '700', marginTop: 16 },
  detailDesc: { color: '#D1D5DB', fontSize: 15, lineHeight: 24, fontWeight: '400' },
  
  actionButtonsContainer: { flexDirection: 'row', gap: 12, marginTop: 40 },
  editBtn: { flex: 1, backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  deleteBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  restoreBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  restoreBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  formMainTitle: { color: '#F9FAFB', fontSize: 24, fontWeight: '800', marginBottom: 20, marginTop: 8 },
  inputLabel: { color: '#D1D5DB', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputField: { backgroundColor: '#111827', color: '#F9FAFB', fontSize: 15, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  textArea: { height: 120, paddingTop: 16 }, 
  
  tagsInputContainer: { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#374151', paddingHorizontal: 16 },
  inputFieldTag: { color: '#F9FAFB', fontSize: 15, paddingVertical: 16 },
  formTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagBadgeForm: { backgroundColor: '#4B5563', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  tagTextForm: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  stickyFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1F2937'
  },
  saveBtn: { backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});