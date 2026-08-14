// ============================================
// src/routes/geolocalizacaoRoutes.ts
// ============================================

import { Router } from 'express';
import GeolocalizacaoController from '../controllers/GeolocalizacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de geolocalização
router.get('/proximos', GeolocalizacaoController.buscarProximos);
router.get('/mapa', GeolocalizacaoController.listarParaMapa);
router.get('/notificacao/:id/verificar-bloqueio', GeolocalizacaoController.verificarBloqueio);
router.patch('/notificacao/:id/coordenadas', GeolocalizacaoController.atualizarCoordenadas);

export default router;