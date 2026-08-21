// ============================================
// src/routes/authRoutes.ts
// ============================================

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';  // ← IMPORTAÇÃO NOMEADA

const router = Router();
const authController = new AuthController();  // ← AGORA FUNCIONA!

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);

export default router;