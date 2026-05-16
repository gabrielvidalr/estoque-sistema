# EstoqueID — Sistema de Gestão de Estoque

Sistema completo de controle de estoque com Node.js + Express + SQLite no backend e React + Vite no frontend.

## Funcionalidades

- ✅ Cadastro de produtos com categoria, unidade, localização e estoque mínimo
- ✅ Entrada e saída de mercadorias com registro completo
- ✅ Rastreamento por número de série
- ✅ Alertas de estoque baixo
- ✅ Dashboard com gráficos de movimentação
- ✅ Histórico completo com filtros e exportação CSV
- ✅ Banco de dados SQLite local (sem precisar de servidor externo)

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação e uso

### 1. Instalar dependências do backend

```bash
cd backend
npm install
```

### 2. Instalar dependências do frontend

```bash
cd frontend
npm install
```

### 3. Iniciar o backend (em um terminal)

```bash
cd backend
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor vai rodar em: http://localhost:3001

### 4. Iniciar o frontend (em outro terminal)

```bash
cd frontend
npm run dev
```

O sistema vai abrir em: http://localhost:3000

## Estrutura do projeto

```
estoque-sistema/
├── backend/
│   ├── server.js       # Servidor Express + todas as rotas API
│   ├── database.js     # Configuração do SQLite e criação das tabelas
│   ├── estoque.db      # Banco de dados (criado automaticamente)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx    # Visão geral e gráficos
    │   │   ├── Produtos.jsx     # CRUD de produtos
    │   │   ├── Entrada.jsx      # Registro de entradas
    │   │   ├── Saida.jsx        # Registro de saídas
    │   │   ├── Historico.jsx    # Histórico completo
    │   │   └── SeriesBusca.jsx  # Busca por número de série
    │   ├── utils/
    │   │   └── api.js           # Chamadas à API
    │   ├── App.jsx              # Rotas e layout
    │   └── main.jsx
    └── package.json
```

## API endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/produtos | Listar produtos |
| POST | /api/produtos | Criar produto |
| PUT | /api/produtos/:id | Atualizar produto |
| DELETE | /api/produtos/:id | Remover produto |
| GET | /api/produtos/:id/series | Séries de um produto |
| GET | /api/series/buscar/:numero | Buscar número de série |
| POST | /api/movimentacoes | Registrar entrada/saída |
| GET | /api/movimentacoes | Listar movimentações |
| GET | /api/dashboard | Dados do dashboard |
| GET | /api/categorias | Listar categorias |

## Backup do banco de dados

O arquivo `backend/estoque.db` contém todos os dados. Faça backup copiando esse arquivo regularmente.

## Screenshots

### Login
![Login](./docs/pagina%20de%20login%20.png)

### Dashboard
![Dashboard](./docs/pagina%20de%20Dashboard%20.png)

### Saída de Mercadoria
![Saída](./docs/saida%20de%20mercadoria%20.png)

### Histórico
![Histórico](./docs/historicos%20.png)

### Relatórios
![Relatórios](./docs/relatorios%20.png)

### Leitor QR
![Leitor QR](./docs/leitor%20qr%20.png)

### Usuários
![Usuários](./docs/usuarios%20.png)
