// ============================================
// src/routes/relatorioRoutes.ts
// ============================================

import { Router } from 'express';
import { RelatorioController } from '../controllers/RelatorioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Todas as rotas requerem autenticação
router.use(authMiddleware);

// ============================================
// ROTAS DE RELATÓRIOS
// ============================================

// 📊 Dados do relatório (inclui estatísticas, localidades, etc.)
router.get('/dados', RelatorioController.getDados);

// 📄 Exportar para Excel
router.get('/excel', RelatorioController.gerarExcel);

// 📄 Exportar para PDF
router.get('/pdf', RelatorioController.gerarPDF);

export default router;