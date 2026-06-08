# GameList Mobile App

Aplicativo móvel desenvolvido em React Native (Expo) para catalogar e gerenciar sua coleção de jogos.

## 📱Funcionalidades
- **Biblioteca Visual:** Interface organizada com cards.
- **Categorização:** Sistema de tags/gêneros.
- **Gerenciamento:** Adição, edição e exclusão de jogos.
- **Mídia:** Seleção de capas de jogos via galeria.
- **Organização:** Sistema de lixeira para itens excluídos.

## 🔧Tecnologias
- **React Native** (Expo)
- **Axios** (Integração com API)
- **Expo Image Picker** (Seletor de fotos)
- **Vector Icons** (Ícones da interface)

## 🚀Como rodar
1. Clone o repositório.
2. Instale as dependências: `npm install`
3. Configure o IP da API no arquivo `src/services/api.js`:
   `const api = axios.create({ baseURL: 'http://SEU_IP_AQUI:3000' });`
4. Inicie o projeto: `npx expo start`
