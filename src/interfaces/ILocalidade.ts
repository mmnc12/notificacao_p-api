// ============================================
// src/interfaces/ILocalidade.ts
// ============================================

export interface ILocalidade {
  id: number;
  codigo?: number | null;
  nome_localidade: string;
  descricao?: string | null;
  created_at?: Date;
  updated_at?: Date | null;
}