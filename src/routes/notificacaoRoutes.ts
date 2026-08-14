// ============================================
// src/routes/notificacaoRoutes.ts
// ============================================

import { Router } from 'express';
import NotificacaoController from '../controllers/NotificacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/', NotificacaoController.listar);
router.get('/:id', NotificacaoController.buscarPorId);
router.post('/', NotificacaoController.criar);
router.put('/:id', NotificacaoController.atualizar);
router.delete('/:id', NotificacaoController.deletar);
router.patch('/:id/bloqueio', NotificacaoController.registrarBloqueio);

export default router;