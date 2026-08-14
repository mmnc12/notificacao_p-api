# 🦟 API - Sistema de Notificação de Arboviroses

API REST para gerenciamento de notificações de casos suspeitos de arboviroses (Dengue, Zika e Chikungunya).

## 🚀 Tecnologias

- Node.js + TypeScript
- Express
- MySQL
- JWT para autenticação
- bcryptjs para criptografia

## 📁 Estrutura do Projeto
src/
├── config/ # Configurações (banco de dados)
├── controllers/ # Controladores das rotas
├── interfaces/ # Interfaces TypeScript
├── middlewares/ # Middlewares (autenticação, erros)
├── repositories/ # Acesso ao banco de dados
├── routes/ # Definição de rotas
├── services/ # Lógica de negócio
├── utils/ # Utilitários (JWT)
└── server.ts # Ponto de entrada


## 🔗 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/registrar` | Registrar novo usuário |
| POST | `/api/auth/login` | Login e geração de token |
| GET | `/api/localidades` | Listar localidades |
| GET | `/api/health` | Verificar status do servidor |