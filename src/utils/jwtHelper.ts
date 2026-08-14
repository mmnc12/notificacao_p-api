// ============================================
// src/utils/jwtHelper.ts
// ============================================

// Importação padrão do CommonJS
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

// Definir uma interface para o payload do token
interface TokenPayload {
  id: number;
  email: string;
  nome: string;
  tipo: string;
}

/**
 * Gera um token JWT
 */
export function gerarToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

  // ✅ Usando a sintaxe correta para CommonJS
  // O 'jwt' já é o objeto correto, não precisa de .default
  return (jwt as any).sign(payload, secret, { expiresIn });
}

/**
 * Verifica e decodifica um token JWT
 */
export function verificarToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_2026';
    // ✅ Usando a sintaxe correta para CommonJS
    const decoded = (jwt as any).verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extrai o token do cabeçalho Authorization
 */
export function extrairToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}