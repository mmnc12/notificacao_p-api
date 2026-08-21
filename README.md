# 🦟 Sistema de Notificação de Arboviroses

Sistema completo para gestão de notificações de casos suspeitos de arboviroses (Dengue, Zika e Chikungunya).

---

## 📋 Índice

- [Sobre o Sistema](#sobre-o-sistema)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Endpoints da API](#endpoints-da-api)
- [Instalação e Configuração](#instalação-e-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Como Usar](#como-usar)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o Sistema

Sistema desenvolvido para a **Secretaria Municipal de Saúde** com o objetivo de:

- ✅ Registrar notificações de casos suspeitos de arboviroses
- ✅ Gerenciar localidades (bairros, regiões)
- ✅ Gerar relatórios estatísticos (PDF e Excel)
- ✅ Visualizar dados georreferenciados em mapa
- ✅ Controlar usuários e níveis de acesso

---

## 🚀 Tecnologias

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| TypeScript | 5.3+ | Tipagem estática |
| Express | 4.18+ | Framework web |
| MySQL | 8.0+ | Banco de dados |
| JWT | 9.0+ | Autenticação |
| bcryptjs | 2.4+ | Criptografia de senhas |
| Helmet | 7.0+ | Segurança |
| CORS | 2.8+ | Controle de acesso |
| ExcelJS | 4.4+ | Geração de Excel |
| PDFKit | 0.14+ | Geração de PDF |

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.2+ | Biblioteca UI |
| Vite | 5.0+ | Build tool |
| TypeScript | 5.0+ | Tipagem estática |
| Tailwind CSS | 3.4+ | Estilização |
| Axios | 1.6+ | HTTP Client |
| React Router | 6.20+ | Roteamento |
| React Hook Form | 7.48+ | Formulários |
| Recharts | 2.10+ | Gráficos |

### Infraestrutura
| Serviço | Função |
|---------|--------|
| **Vercel** | Hospedagem do Frontend |
| **Render** | Hospedagem do Backend |
| **Aiven** | Banco de dados MySQL |

---

## 📁 Estrutura do Projeto
notificacao_p-frontend/ # Frontend React
├── src/
│ ├── components/ # Componentes reutilizáveis
│ │ ├── auth/ # Login, registro
│ │ ├── dashboard/ # Dashboard e gráficos
│ │ ├── notificacoes/ # CRUD de notificações
│ │ ├── localidades/ # CRUD de localidades
│ │ ├── relatorios/ # Relatórios PDF/Excel
│ │ ├── usuarios/ # Gestão de usuários
│ │ └── ui/ # Componentes UI (botões, inputs)
│ ├── contexts/ # Contextos React
│ │ └── AuthContext.tsx # Contexto de autenticação
│ ├── services/ # Serviços de API
│ │ └── api.ts # Configuração do Axios
│ ├── types/ # Tipos TypeScript
│ ├── utils/ # Funções utilitárias
│ ├── App.tsx # Componente principal
│ └── main.tsx # Ponto de entrada
├── public/ # Arquivos estáticos
├── index.html # HTML principal
├── package.json # Dependências
├── vite.config.ts # Configuração do Vite
└── vercel.json # Configuração do Vercel

notificacao_p-api/ # Backend Node.js
├── src/
│ ├── config/ # Configurações
│ │ └── database.ts # Configuração do MySQL
│ ├── controllers/ # Controladores
│ │ ├── AuthController.ts
│ │ ├── LocalidadeController.ts
│ │ ├── NotificacaoController.ts
│ │ ├── RelatorioController.ts
│ │ ├── UsuarioController.ts
│ │ └── GeolocalizacaoController.ts
│ ├── interfaces/ # Interfaces TypeScript
│ ├── middlewares/ # Middlewares
│ │ ├── authMiddleware.ts # Autenticação JWT
│ │ └── errorHandler.ts # Tratamento de erros
│ ├── repositories/ # Acesso ao banco
│ │ ├── LocalidadeRepository.ts
│ │ ├── NotificacaoRepository.ts
│ │ └── UsuarioRepository.ts
│ ├── routes/ # Rotas da API
│ │ ├── authRoutes.ts
│ │ ├── localidadeRoutes.ts
│ │ ├── notificacaoRoutes.ts
│ │ ├── relatorioRoutes.ts
│ │ └── usuarioRoutes.ts
│ ├── services/ # Lógica de negócio
│ │ ├── RelatorioService.ts
│ │ └── GeolocalizacaoService.ts
│ ├── utils/ # Utilitários
│ │ └── jwtHelper.ts # Funções JWT
│ └── server.ts # Ponto de entrada
├── dist/ # Código compilado
├── package.json # Dependências
├── tsconfig.json # Configuração TypeScript
└── .env.example # Exemplo de variáveis

text

---

## ⚙️ Funcionalidades

### 📊 Dashboard
- ✅ Cards com indicadores: Total de notificações, casos por localidade
- ✅ Gráficos de evolução temporal (por mês)
- ✅ Distribuição de casos por localidade
- ✅ Últimas notificações registradas

### 📝 Notificações
- ✅ Cadastro de notificações (data, localidade, observações)
- ✅ Listagem com filtros (localidade, período)
- ✅ Edição e exclusão
- ✅ Georreferenciamento (latitude/longitude)

### 🏘️ Localidades
- ✅ Cadastro de bairros/regiões
- ✅ Listagem e busca
- ✅ Edição e exclusão

### 👥 Usuários
- ✅ Cadastro de usuários (nome, email, senha)
- ✅ Listagem e busca
- ✅ Edição e exclusão
- ✅ Controle de status (ativo/inativo)
- ✅ Autenticação com JWT

### 📄 Relatórios
- ✅ Exportação para Excel (.xlsx)
- ✅ Exportação para PDF
- ✅ Filtros por localidade e período
- ✅ Estatísticas agregadas

### 🗺️ Geolocalização
- ✅ Visualização de casos no mapa
- ✅ Coordenadas por notificação

---

## 🔗 Endpoints da API

### Autenticação
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/api/auth/login` | Login e geração de token | ❌ |
| POST | `/api/auth/registrar` | Registrar novo usuário | ✅ |

### Localidades
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/localidades` | Listar todas | ✅ |
| GET | `/api/localidades/:id` | Buscar por ID | ✅ |
| GET | `/api/localidades/nome/:nome` | Buscar por nome | ✅ |
| POST | `/api/localidades` | Criar | ✅ |
| PUT | `/api/localidades/:id` | Atualizar | ✅ |
| DELETE | `/api/localidades/:id` | Deletar | ✅ |

### Notificações
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/notificacoes` | Listar com filtros | ✅ |
| GET | `/api/notificacoes/:id` | Buscar por ID | ✅ |
| POST | `/api/notificacoes` | Criar | ✅ |
| PUT | `/api/notificacoes/:id` | Atualizar | ✅ |
| DELETE | `/api/notificacoes/:id` | Deletar | ✅ |

### Relatórios
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/relatorios/dados` | Dados para relatório | ✅ |
| GET | `/api/relatorios/excel` | Baixar Excel | ✅ |
| GET | `/api/relatorios/pdf` | Baixar PDF | ✅ |

### Geolocalização
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/geolocalizacao/mapa` | Dados para mapa | ✅ |
| GET | `/api/geolocalizacao/coordenadas/:id` | Coordenadas por notificação | ✅ |

### Health Check
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/health` | Status do servidor | ❌ |

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/mmnc12/notificacao_p-frontend.git
git clone https://github.com/mmnc12/notificacao_p-api.git
2. Backend
bash
cd notificacao_p-api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
3. Frontend
bash
cd notificacao_p-frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL do backend

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm run preview
🔑 Variáveis de Ambiente
Backend (.env)
env
# Servidor
PORT=3001
NODE_ENV=production

# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=notificacao_arboviroses
DB_PORT=3306

# JWT
JWT_SECRET=chave_super_secreta
JWT_EXPIRES_IN=4h

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
Frontend (.env)
env
VITE_API_URL=http://localhost:3001/api
🌐 Deploy
Frontend (Vercel)
Acesse: https://vercel.com

Importe o repositório notificacao_p-frontend

Configure:

Build Command: npm run build

Output Directory: dist

Adicione variável de ambiente:

VITE_API_URL = URL do backend

URL: https://notificacao-arboviroses.vercel.app

Backend (Render)
Acesse: https://render.com

Crie um Web Service

Conecte o repositório notificacao_p-api

Configure:

Build Command: npm install --legacy-peer-deps --include=dev && npm run build

Start Command: node dist/server.js

Adicione as variáveis de ambiente

URL: https://notificacao-arboviroses-api.onrender.com

Banco de Dados (Aiven)
Acesse: https://aiven.io

Crie um serviço MySQL

Plano gratuito (Startup)

Pegue as credenciais de conexão

Configure no Render

👨‍💻 Como Usar
1. Acessar o Sistema
text
URL: https://notificacao-arboviroses.vercel.app
2. Login
Campo	Valor
Email	seuemail@email.com
Senha	seuemail12
3. Fluxos Principais
Cadastrar uma Notificação
Menu → Notificações

Clique em "Nova Notificação"

Preencha os dados

Clique em "Salvar"

Gerar Relatório
Menu → Relatórios

Selecione filtros (localidade, período)

Clique em "Gerar Excel" ou "Gerar PDF"

Gerenciar Localidades
Menu → Localidades

Clique em "Nova Localidade"

Preencha os dados

Clique em "Salvar"

📄 Licença
Este projeto é de uso interno do Setor de Endemias do Municipio de Pindobaçu.

🏆 Desenvolvedor
Nome: Manoel Mecias do Nascimento

Ano: 2026

Projeto: Sistema de Notificação de Arboviroses

📞 Suporte
Em caso de dúvidas ou problemas:

📧 Email: mmnc12@gmail.com  

📱 Telefone: (74) 98106-7364