import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import UsuarioRepository from '../repositories/UsuarioRepository';
import { IUsuarioInput, ILoginInput } from '../interfaces/IUsuario';
import { gerarToken } from '../utils/jwtHelper';

export class AuthController {
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    // ... (mantenha o código igual)
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      console.log('🔍 [LOGIN] Iniciando login...');
      const { email, senha }: ILoginInput = req.body;

      console.log(`📧 [LOGIN] Email recebido: ${email}`);

      if (!email || !senha) {
        console.log('❌ [LOGIN] Email ou senha vazios');
        return res.status(400).json({ 
          error: 'E-mail e senha são obrigatórios.' 
        });
      }

      console.log('🔍 [LOGIN] Buscando usuário no banco...');
      const usuario = await UsuarioRepository.buscarPorEmail(email);
      
      if (!usuario || !usuario.senha) {
        console.log('❌ [LOGIN] Usuário não encontrado');
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      console.log(`✅ [LOGIN] Usuário encontrado: ${usuario.nome}`);
      console.log(`🔍 [LOGIN] Verificando senha...`);

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      
      if (!senhaValida) {
        console.log('❌ [LOGIN] Senha inválida');
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      console.log('✅ [LOGIN] Senha válida! Gerando token...');

      const token = gerarToken({
        id: usuario.id!,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo || 'USUARIO'
      });

      console.log('✅ [LOGIN] Login bem-sucedido!');

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
      console.error('💥 [LOGIN] Erro capturado:', error);
      next(error);
    }
  }
}