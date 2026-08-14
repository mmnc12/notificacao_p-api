// ============================================
// src/services/RelatorioService.ts
// ============================================

import pool from '../config/database';
import { IRelatorioFiltros, IRelatorioEstatisticas } from '../interfaces/IRelatorio';
import { RowDataPacket } from 'mysql2';

class RelatorioService {
  /**
   * Gerar relatório com filtros
   */
  async gerarRelatorio(filtros: IRelatorioFiltros): Promise<any[]> {
    let query = `
      SELECT 
        n.*,
        l.nome_localidade as localidade_nome
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Aplicar filtros
    if (filtros.nome) {
      query += ` AND n.nome_paciente LIKE ?`;
      params.push(`%${filtros.nome}%`);
    }

    if (filtros.localidade_id) {
      query += ` AND n.localidade_id = ?`;
      params.push(filtros.localidade_id);
    }

    if (filtros.status) {
      query += ` AND n.status = ?`;
      params.push(filtros.status);
    }

    if (filtros.ano) {
      query += ` AND YEAR(n.dt_notificacao) = ?`;
      params.push(filtros.ano);
    }

    if (filtros.mes) {
      query += ` AND MONTH(n.dt_notificacao) = ?`;
      params.push(filtros.mes);
    }

    if (filtros.dataInicio && filtros.dataFim) {
      query += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      params.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      query += ` AND n.dt_notificacao >= ?`;
      params.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      query += ` AND n.dt_notificacao <= ?`;
      params.push(filtros.dataFim);
    }

    if (filtros.resultado) {
      query += ` AND n.resultado = ?`;
      params.push(filtros.resultado);
    }

    if (filtros.suspeita_dengue !== undefined) {
      query += ` AND n.suspeita_dengue = ?`;
      params.push(filtros.suspeita_dengue);
    }

    if (filtros.suspeita_zika !== undefined) {
      query += ` AND n.suspeita_zika = ?`;
      params.push(filtros.suspeita_zika);
    }

    if (filtros.suspeita_chikungunya !== undefined) {
      query += ` AND n.suspeita_chikungunya = ?`;
      params.push(filtros.suspeita_chikungunya);
    }

    // Ordenação
    const orderBy = filtros.orderBy || 'n.id';
    const orderDirection = filtros.orderDirection || 'DESC';
    query += ` ORDER BY ${orderBy} ${orderDirection}`;

    // Paginação
    if (filtros.page && filtros.limit) {
      const offset = (filtros.page - 1) * filtros.limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(filtros.limit, offset);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  /**
   * Obter estatísticas
   */
  async obterEstatisticas(filtros: IRelatorioFiltros): Promise<IRelatorioEstatisticas> {
    // Query principal de estatísticas
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ATIVO' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'INATIVO' THEN 1 ELSE 0 END) as inativos,
        SUM(CASE WHEN resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos,
        SUM(CASE WHEN resultado = 'NEGATIVO' THEN 1 ELSE 0 END) as negativos,
        SUM(CASE WHEN resultado = 'INCONCLUSIVO' THEN 1 ELSE 0 END) as inconclusivos,
        SUM(CASE WHEN resultado = 'AGUARDANDO' THEN 1 ELSE 0 END) as aguardando,
        SUM(CASE WHEN suspeita_dengue = TRUE THEN 1 ELSE 0 END) as suspeitas_dengue,
        SUM(CASE WHEN suspeita_zika = TRUE THEN 1 ELSE 0 END) as suspeitas_zika,
        SUM(CASE WHEN suspeita_chikungunya = TRUE THEN 1 ELSE 0 END) as suspeitas_chikungunya,
        SUM(CASE WHEN bloqueio_realizado = TRUE THEN 1 ELSE 0 END) as bloqueios_realizados,
        COUNT(DISTINCT localidade_id) as localidades_afetadas
      FROM notificacoes n
      WHERE 1=1
    `;
    const params: any[] = [];

    // Aplicar filtros de data para as estatísticas
    if (filtros.dataInicio && filtros.dataFim) {
      statsQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      params.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      statsQuery += ` AND n.dt_notificacao >= ?`;
      params.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      statsQuery += ` AND n.dt_notificacao <= ?`;
      params.push(filtros.dataFim);
    }

    if (filtros.ano) {
      statsQuery += ` AND YEAR(n.dt_notificacao) = ?`;
      params.push(filtros.ano);
    }

    if (filtros.status) {
      statsQuery += ` AND n.status = ?`;
      params.push(filtros.status);
    }

    if (filtros.localidade_id) {
      statsQuery += ` AND n.localidade_id = ?`;
      params.push(filtros.localidade_id);
    }

    const [stats] = await pool.query<RowDataPacket[]>(statsQuery, params);
    const estatisticas = stats[0] as any;

    // Estatísticas por localidade
    let localidadeQuery = `
      SELECT 
        l.id as localidade_id,
        l.nome_localidade as localidade_nome,
        COUNT(n.id) as total,
        SUM(CASE WHEN n.status = 'ATIVO' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN n.status = 'INATIVO' THEN 1 ELSE 0 END) as inativos,
        SUM(CASE WHEN n.resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos
      FROM localidades l
      LEFT JOIN notificacoes n ON l.id = n.localidade_id
      WHERE 1=1
    `;
    const localidadeParams: any[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      localidadeQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      localidadeParams.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      localidadeQuery += ` AND n.dt_notificacao >= ?`;
      localidadeParams.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      localidadeQuery += ` AND n.dt_notificacao <= ?`;
      localidadeParams.push(filtros.dataFim);
    }

    if (filtros.status) {
      localidadeQuery += ` AND n.status = ?`;
      localidadeParams.push(filtros.status);
    }

    if (filtros.localidade_id) {
      localidadeQuery += ` AND l.id = ?`;
      localidadeParams.push(filtros.localidade_id);
    }

    localidadeQuery += ` GROUP BY l.id, l.nome_localidade ORDER BY total DESC LIMIT 10`;

    const [porLocalidade] = await pool.query<RowDataPacket[]>(localidadeQuery, localidadeParams);

    // Estatísticas por mês
    let mesQuery = `
      SELECT 
        DATE_FORMAT(dt_notificacao, '%Y-%m') as mes,
        COUNT(*) as total,
        SUM(CASE WHEN resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos
      FROM notificacoes n
      WHERE 1=1
    `;
    const mesParams: any[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      mesQuery += ` AND dt_notificacao BETWEEN ? AND ?`;
      mesParams.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      mesQuery += ` AND dt_notificacao >= ?`;
      mesParams.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      mesQuery += ` AND dt_notificacao <= ?`;
      mesParams.push(filtros.dataFim);
    }

    if (filtros.ano) {
      mesQuery += ` AND YEAR(dt_notificacao) = ?`;
      mesParams.push(filtros.ano);
    }

    mesQuery += ` GROUP BY DATE_FORMAT(dt_notificacao, '%Y-%m') ORDER BY mes DESC LIMIT 12`;

    const [porMes] = await pool.query<RowDataPacket[]>(mesQuery, mesParams);

    // ✅ CORREÇÃO: Converter para o tipo esperado
    return {
      total: Number(estatisticas.total) || 0,
      ativos: Number(estatisticas.ativos) || 0,
      inativos: Number(estatisticas.inativos) || 0,
      positivos: Number(estatisticas.positivos) || 0,
      negativos: Number(estatisticas.negativos) || 0,
      inconclusivos: Number(estatisticas.inconclusivos) || 0,
      aguardando: Number(estatisticas.aguardando) || 0,
      suspeitas_dengue: Number(estatisticas.suspeitas_dengue) || 0,
      suspeitas_zika: Number(estatisticas.suspeitas_zika) || 0,
      suspeitas_chikungunya: Number(estatisticas.suspeitas_chikungunya) || 0,
      bloqueios_realizados: Number(estatisticas.bloqueios_realizados) || 0,
      localidades_afetadas: Number(estatisticas.localidades_afetadas) || 0,
      por_localidade: porLocalidade as any[],
      por_mes: porMes as any[]
    };
  }
}

export default new RelatorioService();