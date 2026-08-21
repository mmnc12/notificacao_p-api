// ============================================
// server.ts - VERSÃO CORRIGIDA E COMPLETA
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import localidadeRoutes from './routes/localidadeRoutes';
import notificacaoRoutes from './routes/notificacaoRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import geolocalizacaoRoutes from './routes/geolocalizacaoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// ✅ CORS - CONFIGURAÇÃO COMPLETA
// ============================================

app.use(cors({
  origin: [
    // Origens para desenvolvimento local
    'http://localhost:5173',
    'http://10.0.0.201:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://10.0.0.201:4173',
    'http://127.0.0.1:4173',
    // Origem do frontend em produção (Vercel)
    'https://notificacao-arboviroses.vercel.app',
    // Origem para domínio personalizado (se tiver)
    'https://seu-dominio-customizado.com',
    // Fallback para variável de ambiente ou qualquer origem (apenas para testes)
    process.env.CORS_ORIGIN || '*',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================

app.use(helmet());

// Rate Limiting - Ignorar requisições OPTIONS (preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

app.use('/api', limiter);
app.use('/api/auth/login', loginLimiter);

// ============================================
// CONFIGURAÇÕES BÁSICAS
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// ROTAS PÚBLICAS
// ============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// ROTAS DA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/localidades', localidadeRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/geolocalizacao', geolocalizacaoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.',
    path: req.path,
    method: req.method,
  });
});

// Middleware de erro global
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Servidor rodando com sucesso!');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('========================================');
});

// ============================================
// FINALIZAÇÃO GRACEFUL
// ============================================

const gracefulShutdown = (signal: string) => {
  console.log(`\n📴 Recebido ${signal}. Finalizando servidor...`);
  server.close(() => {
    console.log('✅ Servidor finalizado com sucesso.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⏰ Timeout ao finalizar. Forçando saída...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Promessa rejeitada sem tratamento:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;