// ============================================
// src/repositories/NotificacaoRepository.ts
// ============================================

import pool from '../config/database';
import { INotificacao, INotificacaoInput, INotificacaoFiltros } from '../interfaces/INotificacao';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class NotificacaoRepository {
  /**
   * Listar notificações com filtros e paginação
   */
  async listarComFiltros(filtros: INotificacaoFiltros): Promise<{ dados: INotificacao[]; total: number }> {
    let query = `
      SELECT 
        n.*,
        l.nome_localidade as localidade_nome
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filtro por nome do paciente
    if (filtros.nome) {
      query += ` AND n.nome_paciente LIKE ?`;
      params.push(`%${filtros.nome}%`);
    }

    // Filtro por localidade
    if (filtros.localidade_id) {
      query += ` AND n.localidade_id = ?`;
      params.push(filtros.localidade_id);
    }

    // Filtro por status
    if (filtros.status) {
      query += ` AND n.status = ?`;
      params.push(filtros.status);
    }

    // Filtro por ano
    if (filtros.ano) {
      query += ` AND YEAR(n.dt_notificacao) = ?`;
      params.push(filtros.ano);
    }

    // Filtro por mês
    if (filtros.mes) {
      query += ` AND MONTH(n.dt_notificacao) = ?`;
      params.push(filtros.mes);
    }

    // Filtro por período
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

    // Filtro por resultado
    if (filtros.resultado) {
      query += ` AND n.resultado = ?`;
      params.push(filtros.resultado);
    }

    // Filtro por suspeita de dengue
    if (filtros.suspeita_dengue !== undefined) {
      query += ` AND n.suspeita_dengue = ?`;
      params.push(filtros.suspeita_dengue);
    }

    // Filtro por suspeita de zika
    if (filtros.suspeita_zika !== undefined) {
      query += ` AND n.suspeita_zika = ?`;
      params.push(filtros.suspeita_zika);
    }

    // Filtro por suspeita de chikungunya
    if (filtros.suspeita_chikungunya !== undefined) {
      query += ` AND n.suspeita_chikungunya = ?`;
      params.push(filtros.suspeita_chikungunya);
    }

    // ============================================
    // ✅ CONTAR TOTAL DE REGISTROS (SEM PAGINAÇÃO)
    // ============================================
    
    // Criar uma cópia da query para contar
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE 1=1
    `;

    // Reaplicar os mesmos filtros para a contagem
    // (usamos os mesmos params, pois os filtros são os mesmos)
    if (filtros.nome) {
      countQuery += ` AND n.nome_paciente LIKE ?`;
    }
    if (filtros.localidade_id) {
      countQuery += ` AND n.localidade_id = ?`;
    }
    if (filtros.status) {
      countQuery += ` AND n.status = ?`;
    }
    if (filtros.ano) {
      countQuery += ` AND YEAR(n.dt_notificacao) = ?`;
    }
    if (filtros.mes) {
      countQuery += ` AND MONTH(n.dt_notificacao) = ?`;
    }
    if (filtros.dataInicio && filtros.dataFim) {
      countQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
    } else if (filtros.dataInicio) {
      countQuery += ` AND n.dt_notificacao >= ?`;
    } else if (filtros.dataFim) {
      countQuery += ` AND n.dt_notificacao <= ?`;
    }
    if (filtros.resultado) {
      countQuery += ` AND n.resultado = ?`;
    }
    if (filtros.suspeita_dengue !== undefined) {
      countQuery += ` AND n.suspeita_dengue = ?`;
    }
    if (filtros.suspeita_zika !== undefined) {
      countQuery += ` AND n.suspeita_zika = ?`;
    }
    if (filtros.suspeita_chikungunya !== undefined) {
      countQuery += ` AND n.suspeita_chikungunya = ?`;
    }

    // Executar a contagem
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // ============================================
    // ✅ APLICAR PAGINAÇÃO
    // ============================================

    const page = filtros.page || 1;
    const limit = filtros.limit || 10;
    const offset = (page - 1) * limit;

    query += ` ORDER BY n.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    return { 
      dados: rows as INotificacao[], 
      total 
    };
  }

  /**
   * Buscar notificação por ID
   */
  async buscarPorId(id: number): Promise<INotificacao | null> {
    const query = `
      SELECT 
        n.*,
        l.nome_localidade as localidade_nome
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE n.id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) return null;
    return rows[0] as INotificacao;
  }

  /**
   * Criar nova notificação
   */
  async criar(dados: INotificacaoInput): Promise<number> {
    const query = `
      INSERT INTO notificacoes (
        dt_primeiros_sintomas,
        nome_paciente,
        nome_mae,
        endereco,
        endereco_completo,
        localidade_id,
        latitude,
        longitude,
        link_google_earth,
        dt_notificacao,
        dt_recebimento,
        suspeita_dengue,
        suspeita_zika,
        suspeita_chikungunya,
        resultado,
        dt_resultado,
        observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      dados.dt_primeiros_sintomas,
      dados.nome_paciente,
      dados.nome_mae,
      dados.endereco || null,
      dados.endereco_completo || null,
      dados.localidade_id,
      dados.latitude || null,
      dados.longitude || null,
      dados.link_google_earth || null,
      dados.dt_notificacao,
      dados.dt_recebimento || null,
      dados.suspeita_dengue,
      dados.suspeita_zika,
      dados.suspeita_chikungunya,
      dados.resultado || 'AGUARDANDO',
      dados.dt_resultado || null,
      dados.observacoes || null
    ];

    const [result] = await pool.query<ResultSetHeader>(query, values);
    return result.insertId;
  }

  /**
   * Atualizar notificação
   */
  async atualizar(id: number, dados: Partial<INotificacaoInput>): Promise<boolean> {
    const query = `
      UPDATE notificacoes SET
        dt_primeiros_sintomas = ?,
        nome_paciente = ?,
        nome_mae = ?,
        endereco = ?,
        endereco_completo = ?,
        localidade_id = ?,
        latitude = ?,
        longitude = ?,
        link_google_earth = ?,
        dt_notificacao = ?,
        dt_recebimento = ?,
        suspeita_dengue = ?,
        suspeita_zika = ?,
        suspeita_chikungunya = ?,
        resultado = ?,
        dt_resultado = ?,
        observacoes = ?
      WHERE id = ?
    `;

    const values = [
      dados.dt_primeiros_sintomas,
      dados.nome_paciente,
      dados.nome_mae,
      dados.endereco || null,
      dados.endereco_completo || null,
      dados.localidade_id,
      dados.latitude || null,
      dados.longitude || null,
      dados.link_google_earth || null,
      dados.dt_notificacao,
      dados.dt_recebimento || null,
      dados.suspeita_dengue,
      dados.suspeita_zika,
      dados.suspeita_chikungunya,
      dados.resultado || 'AGUARDANDO',
      dados.dt_resultado || null,
      dados.observacoes || null,
      id
    ];

    const [result] = await pool.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Atualizar apenas a data de recebimento
   */
  async atualizarRecebimento(id: number, dt_recebimento: string | null): Promise<boolean> {
    const query = `
      UPDATE notificacoes SET
        dt_recebimento = ?
      WHERE id = ?
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [dt_recebimento, id]);
    return result.affectedRows > 0;
  }

  /**
   * Deletar notificação
   */
  async deletar(id: number): Promise<boolean> {
    const query = 'DELETE FROM notificacoes WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Registrar bloqueio
   */
  async registrarBloqueio(id: number, observacoes?: string): Promise<boolean> {
    const query = `
      UPDATE notificacoes SET
        bloqueio_realizado = TRUE,
        dt_bloqueio = CURDATE(),
        observacoes_bloqueio = ?
      WHERE id = ?
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [observacoes || null, id]);
    return result.affectedRows > 0;
  }

  /**
   * Atualizar coordenadas de uma notificação
   */
  async atualizarCoordenadas(
    id: number,
    latitude: number,
    longitude: number,
    link_google_earth?: string
  ): Promise<boolean> {
    const query = `
      UPDATE notificacoes SET
        latitude = ?,
        longitude = ?,
        link_google_earth = ?
      WHERE id = ?
    `;
    const [result] = await pool.query<ResultSetHeader>(
      query,
      [latitude, longitude, link_google_earth || null, id]
    );
    return result.affectedRows > 0;
  }
}

export default new NotificacaoRepository();