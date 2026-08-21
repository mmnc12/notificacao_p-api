// ============================================
// src/middlewares/authMiddleware.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verificarToken, extrairToken } from '../utils/jwtHelper';

// ✅ MIDDLEWARE DE AUTENTICAÇÃO
export function authMiddleware(req: Request, res: Response, next: NextFunction): Response | void {
  const token = extrairToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido.'
    });
  }

  const decoded = verificarToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Token inválido ou expirado.'
    });
  }

  (req as any).usuario = decoded;
  return next();
}

// ✅ MIDDLEWARE DE ADMIN (NOVO)
export function adminMiddleware(req: Request, res: Response, next: NextFunction): Response | void {
  const usuario = (req as any).usuario;

  if (!usuario || usuario.tipo !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
  }

  return next();
}