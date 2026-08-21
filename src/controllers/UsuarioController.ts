// ============================================
// src/controllers/UsuarioController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import UsuarioRepository from '../repositories/UsuarioRepository';
import bcrypt from 'bcryptjs';

class UsuarioController {
  /**
   * Buscar perfil do usuário autenticado
   */
  async buscarPerfil(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const usuarioId = (req as any).usuario?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const usuario = await UsuarioRepository.buscarPorId(usuarioId);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário
   */
  async alterarSenha(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const usuarioId = (req as any).usuario?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const { senha_atual, nova_senha, confirmar_senha } = req.body;

      if (!senha_atual || !nova_senha || !confirmar_senha) {
        return res.status(400).json({ error: 'Todos os campos de senha são obrigatórios.' });
      }

      if (nova_senha.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }

      if (nova_senha !== confirmar_senha) {
        return res.status(400).json({ error: 'As senhas não coincidem.' });
      }

      const usuario = await UsuarioRepository.buscarPorIdComSenha(usuarioId);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const senhaValida = await bcrypt.compare(senha_atual, usuario.senha!);
      if (!senhaValida) {
        return res.status(400).json({ error: 'Senha atual incorreta.' });
      }

      const novaSenhaHash = await bcrypt.hash(nova_senha, 10);
      const atualizado = await UsuarioRepository.atualizarSenha(usuarioId, novaSenhaHash);

      if (!atualizado) {
        return res.status(500).json({ error: 'Erro ao atualizar senha.' });
      }

      return res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // ✅ ENDPOINTS DE ADMINISTRAÇÃO (apenas ADMIN)
  // ============================================

  /**
   * Listar todos os usuários (apenas ADMIN)
   */
  async listarTodos(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const usuarios = await UsuarioRepository.listarTodos();
      return res.status(200).json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo usuário (apenas ADMIN)
   */
  async criarUsuario(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { nome, email, senha, tipo } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const usuarioExistente = await UsuarioRepository.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({ error: 'E-mail já cadastrado.' });
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

  /**
 * Atualizar dados do usuário (apenas ADMIN)
 */
  async atualizarUsuario(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { nome, email, tipo, status, senha } = req.body;

      if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      }

      // Verificar se o usuário existe
      const usuarioExistente = await UsuarioRepository.buscarPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Verificar se o email já está em uso por outro usuário
      const usuarioPorEmail = await UsuarioRepository.buscarPorEmail(email);
      if (usuarioPorEmail && usuarioPorEmail.id !== id) {
        return res.status(409).json({ error: 'E-mail já está em uso por outro usuário.' });
      }

      // ✅ PREPARAR DADOS PARA ATUALIZAÇÃO
      const dadosAtualizar: any = { nome, email, tipo, status: status || 'ATIVO' };

      // ✅ SE SENHA FOI FORNECIDA, CRIPTOGRAFAR
      if (senha) {
        dadosAtualizar.senha = await bcrypt.hash(senha, 10);
      }

      const atualizado = await UsuarioRepository.atualizar(id, dadosAtualizar);
      if (!atualizado) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
      }

      const usuario = await UsuarioRepository.buscarPorId(id);
      return res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar status do usuário (apenas ADMIN)
   */
  async atualizarStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { status } = req.body;

      if (!status || !['ATIVO', 'INATIVO', 'BLOQUEADO'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const atualizado = await UsuarioRepository.atualizarStatus(id, status);
      if (!atualizado) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.status(200).json({ message: 'Status atualizado com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar usuário (apenas ADMIN)
   */
  async deletarUsuario(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      // Não permitir deletar o próprio usuário
      const usuarioLogado = (req as any).usuario;
      if (usuarioLogado.id === id) {
        return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário.' });
      }

      const deletado = await UsuarioRepository.deletar(id);
      if (!deletado) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsuarioController();