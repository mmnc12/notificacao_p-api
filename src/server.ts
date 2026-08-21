// ============================================
// server.ts - COM ROTA DE TESTE /ping
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
// ✅ CORS
// ============================================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================
// ROTA DE TESTE DIRETA (/ping)
// ============================================

app.get('/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong', 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// CONFIGURAÇÕES BÁSICAS
// ============================================

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROTAS DA API
// ============================================

console.log('✅ Carregando rotas...');

app.use('/api/auth', authRoutes);
console.log('  ✅ /api/auth carregada');

app.use('/api/localidades', localidadeRoutes);
console.log('  ✅ /api/localidades carregada');

app.use('/api/notificacoes', notificacaoRoutes);
console.log('  ✅ /api/notificacoes carregada');

app.use('/api/relatorios', relatorioRoutes);
console.log('  ✅ /api/relatorios carregada');

app.use('/api/geolocalizacao', geolocalizacaoRoutes);
console.log('  ✅ /api/geolocalizacao carregada');

app.use('/api/usuarios', usuarioRoutes);
console.log('  ✅ /api/usuarios carregada');

// ============================================
// ROTA HEALTH
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
// TRATAMENTO DE ERROS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.',
    path: req.path,
    method: req.method,
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

export default app;