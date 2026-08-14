// ============================================
// src/interfaces/IUsuario.ts
// ============================================

export interface IUsuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo?: 'ADMIN' | 'AGENTE' | 'USUARIO';
  status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  created_at?: Date;
  updated_at?: Date | null;
}

export interface IUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  tipo?: 'ADMIN' | 'AGENTE' | 'USUARIO';
}

export interface ILoginInput {
  email: string;
  senha: string;
}