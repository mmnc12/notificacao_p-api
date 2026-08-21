// ============================================
// src/controllers/AuthController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import UsuarioRepository from '../repositories/UsuarioRepository';
import { IUsuarioInput, ILoginInput } from '../interfaces/IUsuario';
import { gerarToken } from '../utils/jwtHelper';

export class AuthController {
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { nome, email, senha, tipo }: IUsuarioInput = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ 
          error: 'Nome, e-mail e senha são obrigatórios.' 
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'E-mail inválido.' });
      }

      if (senha.length < 6) {
        return res.status(400).json({ 
          error: 'Senha deve ter no mínimo 6 caracteres.' 
        });
      }

      const usuarioExistente = await UsuarioRepository.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({ error: 'E-mail já cadastrado no sistema.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const insertId = await UsuarioRepository.criar({
        nome,
        email,
        senha: senhaHash,
        tipo: tipo || 'USUARIO'
      });
      const novoUsuario = await UsuarioRepository.buscarPorId(insertId);

      return res.status(201).json(novoUsuario);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, senha }: ILoginInput = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          error: 'E-mail e senha são obrigatórios.' 
        });
      }

      const usuario = await UsuarioRepository.buscarPorEmail(email);
      if (!usuario || !usuario.senha) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (usuario.status === 'INATIVO' || usuario.status === 'BLOQUEADO') {
        return res.status(401).json({ 
          error: 'Usuário inativo ou bloqueado. Contate o administrador.' 
        });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = gerarToken({
        id: usuario.id!,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo || 'USUARIO'
      });

      return res.status(200).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          status: usuario.status
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }
}