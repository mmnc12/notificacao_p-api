import pool from '../config/database';
import { ILocalidade } from '../interfaces/ILocalidade';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class LocalidadeRepository {
  async listarTodas(): Promise<ILocalidade[]> {
    const query = `
      SELECT 
        id, 
        codigo, 
        nome_localidade, 
        descricao
      FROM localidades 
      ORDER BY nome_localidade ASC;
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as ILocalidade[];
  }

  async buscarPorId(id: number): Promise<ILocalidade | null> {
    const query = 'SELECT id, codigo, nome_localidade, descricao FROM localidades WHERE id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    if (rows.length === 0) return null;
    return rows[0] as ILocalidade;
  }

  // ✅ CRIAR
  async criar(dados: { codigo?: number; nome_localidade: string; descricao?: string }): Promise<number> {
    const query = 'INSERT INTO localidades (codigo, nome_localidade, descricao) VALUES (?, ?, ?)';
    const [result] = await pool.query<ResultSetHeader>(query, [
      dados.codigo || null,
      dados.nome_localidade,
      dados.descricao || null,
    ]);
    return result.insertId;
  }

  // ✅ ATUALIZAR
  async atualizar(id: number, dados: { codigo?: number; nome_localidade: string; descricao?: string }): Promise<boolean> {
    const query = 'UPDATE localidades SET codigo = ?, nome_localidade = ?, descricao = ? WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [
      dados.codigo || null,
      dados.nome_localidade,
      dados.descricao || null,
      id,
    ]);
    return result.affectedRows > 0;
  }

  // ✅ DELETAR
  async deletar(id: number): Promise<{ success: boolean; message?: string }> {
    // Verificar se a localidade está sendo usada
    const checkQuery = 'SELECT COUNT(*) as total FROM notificacoes WHERE localidade_id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(checkQuery, [id]);

    if (rows[0].total > 0) {
      return {
        success: false,
        message: `Não é possível excluir esta localidade. Ela está sendo usada em ${rows[0].total} notificação(ões).`
      };
    }

    const query = 'DELETE FROM localidades WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [id]);
    return { success: result.affectedRows > 0 };
  }
}

export default new LocalidadeRepository();