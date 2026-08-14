// ============================================
// src/repositories/LocalidadeRepository.ts
// ============================================

import pool from '../config/database';
import { ILocalidade } from '../interfaces/ILocalidade';
import { RowDataPacket } from 'mysql2';

class LocalidadeRepository {
  /**
   * Listar todas as localidades
   */
  async listarTodas(): Promise<ILocalidade[]> {
    const query = `
      SELECT 
        id, 
        codigo, 
        nome_localidade, 
        descricao,
        created_at,
        updated_at
      FROM localidades 
      ORDER BY nome_localidade ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as ILocalidade[];
  }
}

export default new LocalidadeRepository();