import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import api from '../services/api'

export default function DetalhesScreen({ route, navigation }) {
  const { id } = route.params
  const [jogo, setJogo] = useState(null)

  useEffect(() => {
    api.get(`/jogos/${id}`).then(({ data }) => setJogo(data))
  }, [id])

  const deletar = () => {
    Alert.alert('Confirmar', 'Deseja deletar esse jogo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/jogos/${id}`)
          navigation.goBack()
        }
      }
    ])
  }

  if (!jogo) return <View style={styles.container}><Text style={styles.loading}>Carregando...</Text></View>

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>{jogo.titulo}</Text>
      <Text style={styles.genero}>{jogo.genero}</Text>
      <Text style={styles.estrelas}>{'⭐'.repeat(jogo.avaliacao)}</Text>

      {jogo.descricao ? (
        <>
          <Text style={styles.label}>Descrição</Text>
          <Text style={styles.descricao}>{jogo.descricao}</Text>
        </>
      ) : null}

      <View style={styles.botoes}>
        <TouchableOpacity
          style={styles.botaoEditar}
          onPress={() => navigation.navigate('Formulario', { id: jogo.id })}
        >
          <Text style={styles.botaoTexto}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoDeletar} onPress={deletar}>
          <Text style={styles.botaoTexto}>🗑️ Deletar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  loading: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  titulo: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  genero: { color: '#aaa', fontSize: 14, marginTop: 6 },
  estrelas: { fontSize: 22, marginTop: 8 },
  label: { color: '#aaa', marginTop: 24, marginBottom: 6 },
  descricao: { color: '#ddd', fontSize: 15, lineHeight: 22 },
  botoes: { flexDirection: 'row', gap: 12, marginTop: 40, marginBottom: 40 },
  botaoEditar: { flex: 1, backgroundColor: '#6c63ff', padding: 14, borderRadius: 10, alignItems: 'center' },
  botaoDeletar: { flex: 1, backgroundColor: '#c0392b', padding: 14, borderRadius: 10, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
})