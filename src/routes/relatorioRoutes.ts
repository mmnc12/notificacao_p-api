// ============================================
// src/routes/relatorioRoutes.ts
// ============================================

import { Router } from 'express';
import RelatorioController from '../controllers/RelatorioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de relatórios
router.get('/', RelatorioController.gerarRelatorio);
router.get('/estatisticas', RelatorioController.obterEstatisticas);
router.get('/excel', RelatorioController.exportarExcel);
router.get('/pdf', RelatorioController.exportarPDF);
router.get('/csv', RelatorioController.exportarCSV);

export default router;