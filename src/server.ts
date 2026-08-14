// ============================================
// server.ts - VERSÃO LIMPA
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ============================================
// CONFIGURAÇÕES BÁSICAS
// ============================================

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROTAS
// ============================================

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de autenticação (pública)
app.use('/api/auth', authRoutes);

app.use('/api/localidades', localidadeRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.',
    path: req.path,
    method: req.method
  });
});

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
// GRACEFUL SHUTDOWN
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