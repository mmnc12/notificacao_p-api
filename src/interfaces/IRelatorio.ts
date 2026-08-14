// ============================================
// src/interfaces/IRelatorio.ts
// ============================================

export interface IRelatorioFiltros {
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
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface IRelatorioEstatisticas {
  total: number;
  ativos: number;
  inativos: number;
  positivos: number;
  negativos: number;
  inconclusivos: number;
  aguardando: number;
  suspeitas_dengue: number;
  suspeitas_zika: number;
  suspeitas_chikungunya: number;
  bloqueios_realizados: number;
  localidades_afetadas: number;
  por_localidade: {
    localidade_id: number;
    localidade_nome: string;
    total: number;
    ativos: number;
    inativos: number;
    positivos: number;
  }[];
  por_mes: {
    mes: string;
    total: number;
    positivos: number;
  }[];
}