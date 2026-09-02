// ============================================
// src/repositories/NotificacaoRepository.ts
// ============================================

import pool from '../config/database';
import { INotificacao, INotificacaoInput, INotificacaoFiltros } from '../interfaces/INotificacao';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class NotificacaoRepository {
  /**
   * ✅ Função para calcular dias entre duas datas
   */
  private calcularDias(dataSintomas: string): number {
    if (!dataSintomas) return 999;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let dataStr = dataSintomas;
    if (dataStr.includes('T')) {
      dataStr = dataStr.split('T')[0];
    }

    const partes = dataStr.split('-');
    if (partes.length !== 3) return 0;

    const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    data.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(hoje.getTime() - data.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * ✅ Função para calcular status baseado nos dias
   */
  private calcularStatus(dataSintomas: string): 'ATIVO' | 'INATIVO' {
    if (!dataSintomas) return 'INATIVO';
    const diffDays = this.calcularDias(dataSintomas);
    return diffDays >= 15 ? 'INATIVO' : 'ATIVO';
  }

  /**
   * ✅ Verifica e atualiza status dos registros se necessário (VERSÃO ESTÁVEL)
   */
  private async verificarEAtualizarStatus(rows: any[]): Promise<void> {
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
      try {
        if (!row || !row.id || !row.dt_primeiros_sintomas) continue;

        const diffDays = this.calcularDias(row.dt_primeiros_sintomas);
        if (diffDays >= 15 && row.status === 'ATIVO') {
          await pool.query(
            'UPDATE notificacoes SET status = ? WHERE id = ?',
            ['INATIVO', row.id]
          );
          row.status = 'INATIVO';
        }
      } catch (error) {
        // Silencioso para não quebrar a aplicação
      }
    }
  }

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

    // Contagem
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE 1=1
    `;

    if (filtros.nome) countQuery += ` AND n.nome_paciente LIKE ?`;
    if (filtros.localidade_id) countQuery += ` AND n.localidade_id = ?`;
    if (filtros.status) countQuery += ` AND n.status = ?`;
    if (filtros.ano) countQuery += ` AND YEAR(n.dt_notificacao) = ?`;
    if (filtros.mes) countQuery += ` AND MONTH(n.dt_notificacao) = ?`;
    if (filtros.dataInicio && filtros.dataFim) countQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
    else if (filtros.dataInicio) countQuery += ` AND n.dt_notificacao >= ?`;
    else if (filtros.dataFim) countQuery += ` AND n.dt_notificacao <= ?`;
    if (filtros.resultado) countQuery += ` AND n.resultado = ?`;
    if (filtros.suspeita_dengue !== undefined) countQuery += ` AND n.suspeita_dengue = ?`;
    if (filtros.suspeita_zika !== undefined) countQuery += ` AND n.suspeita_zika = ?`;
    if (filtros.suspeita_chikungunya !== undefined) countQuery += ` AND n.suspeita_chikungunya = ?`;

    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    const page = filtros.page || 1;
    const limit = filtros.limit || 10;
    const offset = (page - 1) * limit;

    query += ` ORDER BY n.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // ✅ VERIFICAR E ATUALIZAR STATUS DOS REGISTROS EXIBIDOS
    await this.verificarEAtualizarStatus(rows);

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

    // ✅ VERIFICAR E ATUALIZAR STATUS DO REGISTRO
    await this.verificarEAtualizarStatus(rows);

    return rows[0] as INotificacao;
  }

  /**
   * Criar nova notificação
   */
  async criar(dados: INotificacaoInput): Promise<number> {
    const status = this.calcularStatus(dados.dt_primeiros_sintomas);

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
        status,
        suspeita_dengue,
        suspeita_zika,
        suspeita_chikungunya,
        resultado,
        dt_resultado,
        observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status,
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
    const status = this.calcularStatus(dados.dt_primeiros_sintomas || '');

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
        status = ?,
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
      status,
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