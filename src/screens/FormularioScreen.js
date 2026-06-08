import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import api from '../services/api'

export default function FormularioScreen({ route, navigation }) {
  const { id } = route.params ?? {}

  const [titulo, setTitulo] = useState('')
  const [genero, setGenero] = useState('')
  const [descricao, setDescricao] = useState('')
  const [avaliacao, setAvaliacao] = useState(0)

  useEffect(() => {
    if (id) {
      api.get(`/jogos/${id}`).then(({ data }) => {
        setTitulo(data.titulo)
        setGenero(data.genero)
        setDescricao(data.descricao ?? '')
        setAvaliacao(data.avaliacao)
      })
    }
  }, [id])

  const salvar = async () => {
    if (!titulo || !genero) {
      Alert.alert('Atenção', 'Título e gênero são obrigatórios!')
      return
    }

    const formData = new FormData()
    formData.append('titulo', titulo)
    formData.append('genero', genero)
    formData.append('descricao', descricao)
    formData.append('avaliacao', String(avaliacao))

    if (id) {
      await api.put(`/jogos/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      await api.post('/jogos', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }

    navigation.goBack()
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholderTextColor="#aaa" placeholder="Ex: Minecraft" />

      <Text style={styles.label}>Gênero</Text>
      <TextInput style={styles.input} value={genero} onChangeText={setGenero} placeholderTextColor="#aaa" placeholder="Ex: Sobrevivência" />

      <Text style={styles.label}>Descrição</Text>
      <TextInput style={[styles.input, styles.textarea]} value={descricao} onChangeText={setDescricao} placeholderTextColor="#aaa" placeholder="O que você viveu nesse jogo..." multiline numberOfLines={4} />

      <Text style={styles.label}>Avaliação</Text>
      <View style={styles.estrelas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setAvaliacao(n)}>
            <Text style={styles.estrela}>{n <= avaliacao ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.botao} onPress={salvar}>
        <Text style={styles.botaoTexto}>{id ? 'Salvar alterações' : 'Adicionar jogo'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  label: { color: '#aaa', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 12, borderRadius: 8 },
  textarea: { height: 100, textAlignVertical: 'top' },
  estrelas: { flexDirection: 'row', gap: 8, marginTop: 8 },
  estrela: { fontSize: 28 },
  botao: { backgroundColor: '#6c63ff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
})