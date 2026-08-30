// ============================================
// src/interfaces/INotificacao.ts
// ============================================

export interface INotificacao {
  id?: number;
  dt_primeiros_sintomas: string;
  nome_paciente: string;
  nome_mae: string;
  endereco: string | null;
  endereco_completo: string | null;
  localidade_id: number;
  latitude: number | null;
  longitude: number | null;
  link_google_earth: string | null;
  dt_notificacao: string;
  dt_recebimento?: string | null;
  status: 'ATIVO' | 'INATIVO';
  suspeita_dengue: boolean;
  suspeita_zika: boolean;
  suspeita_chikungunya: boolean;
  resultado: 'POSITIVO' | 'NEGATIVO' | 'INCONCLUSIVO' | 'AGUARDANDO';
  dt_resultado: string | null;
  bloqueio_realizado: boolean;
  dt_bloqueio: string | null;
  observacoes_bloqueio: string | null;
  observacoes: string | null;
  created_at?: Date;
  updated_at?: Date | null;
}

export interface INotificacaoInput {
  dt_primeiros_sintomas: string;
  nome_paciente: string;
  nome_mae: string;
  endereco?: string;
  endereco_completo?: string;
  localidade_id: number;
  latitude?: number;
  longitude?: number;
  link_google_earth?: string;
  dt_notificacao: string;
  dt_recebimento?: string | null;
  status?: 'ATIVO' | 'INATIVO';  // ✅ ADICIONADO (opcional, calculado pelo backend)
  suspeita_dengue: boolean;
  suspeita_zika: boolean;
  suspeita_chikungunya: boolean;
  resultado?: 'POSITIVO' | 'NEGATIVO' | 'INCONCLUSIVO' | 'AGUARDANDO';
  dt_resultado?: string;
  observacoes?: string;
}

export interface INotificacaoFiltros {
  nome?: string;
  localidade_id?: number;
  status?: 'ATIVO' | 'INATIVO';
  ano?: number;
  mes?: number;
  dataInicio?: string;
  dataFim?: string;
  resultado?: 'POSITIVO' | 'NEGATIVO' | 'INCONCLUSIVO' | 'AGUARDANDO';
  suspeita_dengue?: boolean;
  suspeita_zika?: boolean;
  suspeita_chikungunya?: boolean;
  page?: number;
  limit?: number;
}