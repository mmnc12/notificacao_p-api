// ============================================
// src/middlewares/errorHandler.ts
// ============================================

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error('❌ Erro na aplicação:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message,
      type: 'VALIDATION_ERROR'
    });
  }

  // Erro de não encontrado
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: err.message,
      type: 'NOT_FOUND'
    });
  }

  // Erro de banco de dados - Duplicado
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Registro duplicado no sistema.',
      type: 'DUPLICATE_ERROR'
    });
  }

  // Erro de banco de dados - Chave estrangeira
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      error: 'Registro está sendo usado em outra tabela.',
      type: 'FOREIGN_KEY_ERROR'
    });
  }

  // Erro de autenticação (JWT)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido.',
      type: 'JWT_ERROR'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado. Faça login novamente.',
      type: 'JWT_EXPIRED'
    });
  }

  // Erro genérico
  return res.status(500).json({
    error: 'Erro interno no servidor.',
    type: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}