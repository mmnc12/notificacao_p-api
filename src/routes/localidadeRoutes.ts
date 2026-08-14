// ============================================
// src/routes/localidadeRoutes.ts
// ============================================

import { Router } from 'express';
import LocalidadeController from '../controllers/LocalidadeController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Rota protegida - requer autenticação
router.get('/', authMiddleware, LocalidadeController.listar);

export default router;