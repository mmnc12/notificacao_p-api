// ============================================
// src/repositories/UsuarioRepository.ts
// ============================================

import pool from '../config/database';
import { IUsuario, IUsuarioInput } from '../interfaces/IUsuario';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class UsuarioRepository {
  async buscarPorEmail(email: string): Promise<IUsuario | null> {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  async buscarPorId(id: number): Promise<IUsuario | null> {
    const query = 'SELECT id, nome, email, tipo, status, created_at FROM usuarios WHERE id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  async buscarPorIdComSenha(id: number): Promise<IUsuario | null> {
    const query = 'SELECT * FROM usuarios WHERE id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  async criar(dados: IUsuarioInput): Promise<number> {
    const query = `
      INSERT INTO usuarios (nome, email, senha, tipo, status)
      VALUES (?, ?, ?, ?, 'ATIVO')
    `;
    const values = [
      dados.nome,
      dados.email,
      dados.senha,
      dados.tipo || 'USUARIO'
    ];
    const [result] = await pool.query<ResultSetHeader>(query, values);
    return result.insertId;
  }

  /**
   * Atualizar dados do usuário (com senha opcional)
   */
  async atualizar(id: number, dados: {
    nome: string;
    email: string;
    tipo: string;
    status?: string;
    senha?: string;
  }): Promise<boolean> {
    let query = `
      UPDATE usuarios SET 
        nome = ?, 
        email = ?, 
        tipo = ?, 
        status = ?
    `;
    const values: any[] = [dados.nome, dados.email, dados.tipo, dados.status || 'ATIVO'];

    // ✅ SE SENHA FOI FORNECIDA, ADICIONAR AO UPDATE
    if (dados.senha) {
      query += `, senha = ?`;
      values.push(dados.senha);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    const [result] = await pool.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  async atualizarSenha(id: number, senhaHash: string): Promise<boolean> {
    const query = 'UPDATE usuarios SET senha = ? WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [senhaHash, id]);
    return result.affectedRows > 0;
  }

  async listarTodos(): Promise<IUsuario[]> {
    const query = 'SELECT id, nome, email, tipo, status, created_at FROM usuarios ORDER BY nome';
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as IUsuario[];
  }

  async atualizarStatus(id: number, status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'): Promise<boolean> {
    const query = 'UPDATE usuarios SET status = ? WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [status, id]);
    return result.affectedRows > 0;
  }

  async deletar(id: number): Promise<boolean> {
    const query = 'DELETE FROM usuarios WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }
}

export default new UsuarioRepository();