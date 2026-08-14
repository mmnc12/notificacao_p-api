// ============================================
// src/repositories/NotificacaoRepository.ts
// ============================================

import pool from '../config/database';
import { INotificacao, INotificacaoInput, INotificacaoFiltros } from '../interfaces/INotificacao';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class NotificacaoRepository {
  /**
   * Listar notificações com filtros
   */
  async listarComFiltros(filtros: INotificacaoFiltros): Promise<INotificacao[]> {
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

    query += ` ORDER BY n.id DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as INotificacao[];
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
      dados.dt_recebimento,
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
      dados.dt_recebimento,
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