// ============================================
// src/repositories/UsuarioRepository.ts
// ============================================

import pool from '../config/database';
import { IUsuario, IUsuarioInput } from '../interfaces/IUsuario';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class UsuarioRepository {
  /**
   * Buscar usuário por email
   */
  async buscarPorEmail(email: string): Promise<IUsuario | null> {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(id: number): Promise<IUsuario | null> {
    const query = 'SELECT id, nome, email, tipo, status, created_at FROM usuarios WHERE id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  /**
   * Criar novo usuário
   */
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
   * Listar todos os usuários
   */
  async listarTodos(): Promise<IUsuario[]> {
    const query = 'SELECT id, nome, email, tipo, status, created_at FROM usuarios ORDER BY nome';
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as IUsuario[];
  }

  /**
   * Atualizar status do usuário
   */
  async atualizarStatus(id: number, status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'): Promise<boolean> {
    const query = 'UPDATE usuarios SET status = ? WHERE id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [status, id]);
    return result.affectedRows > 0;
  }
}

export default new UsuarioRepository();