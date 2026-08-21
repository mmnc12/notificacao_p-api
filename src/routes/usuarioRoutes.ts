// ============================================
// src/routes/usuarioRoutes.ts
// ============================================

import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// 🔒 Todas as rotas requerem autenticação
router.use(authMiddleware);

// ============================================
// ROTAS PARA O PRÓPRIO USUÁRIO (qualquer usuário logado)
// ============================================

router.get('/perfil', UsuarioController.buscarPerfil);
router.put('/alterar-senha', UsuarioController.alterarSenha);

// ============================================
// ROTAS DE ADMINISTRAÇÃO (apenas ADMIN)
// ============================================

router.get('/', adminMiddleware, UsuarioController.listarTodos);
router.post('/', adminMiddleware, UsuarioController.criarUsuario);
router.put('/:id', adminMiddleware, UsuarioController.atualizarUsuario);
router.patch('/:id/status', adminMiddleware, UsuarioController.atualizarStatus);
router.delete('/:id', adminMiddleware, UsuarioController.deletarUsuario);

export default router;