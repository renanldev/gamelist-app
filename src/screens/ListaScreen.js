import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import api from '../services/api'

export default function ListaScreen({ navigation }) {
  const [jogos, setJogos] = useState([])

  const carregar = async () => {
    const { data } = await api.get('/jogos')
    setJogos(data)
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', carregar)
    return unsubscribe
  }, [navigation])

  return (
    <View style={styles.container}>
      <FlatList
        data={jogos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Detalhes', { id: item.id })}
          >
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.genero}>{item.genero}</Text>
            <Text style={styles.estrelas}>{'⭐'.repeat(item.avaliacao)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum jogo ainda. Adicione um!</Text>}
      />
      <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('Formulario', {})}>
        <Text style={styles.botaoTexto}>+ Adicionar Jogo</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  card: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 10, marginBottom: 12 },
  titulo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  genero: { color: '#aaa', fontSize: 13, marginTop: 4 },
  estrelas: { fontSize: 14, marginTop: 6 },
  vazio: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  botao: { backgroundColor: '#6c63ff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
})