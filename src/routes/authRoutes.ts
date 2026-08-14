// ============================================
// src/routes/authRoutes.ts
// ============================================

import { Router } from 'express';
// ✅ CORRETO (sem .js)
import AuthController from '../controllers/AuthController';

const router = Router();

router.post('/registrar', AuthController.registrar);
router.post('/login', AuthController.login);

export default router;