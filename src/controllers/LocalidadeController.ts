import { Request, Response, NextFunction } from 'express';
import LocalidadeRepository from '../repositories/LocalidadeRepository';

class LocalidadeController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const localidades = await LocalidadeRepository.listarTodas();
      return res.status(200).json(localidades);
    } catch (error) {
      next(error);
    }
  }

  // ✅ CRIAR LOCALIDADE
  async criar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { codigo, nome_localidade, descricao } = req.body;

      if (!nome_localidade) {
        return res.status(400).json({ error: 'Nome da localidade é obrigatório.' });
      }

      const id = await LocalidadeRepository.criar({ codigo, nome_localidade, descricao });
      const localidade = await LocalidadeRepository.buscarPorId(id);

      return res.status(201).json(localidade);
    } catch (error) {
      next(error);
    }
  }

  // ✅ ATUALIZAR LOCALIDADE
  async atualizar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { codigo, nome_localidade, descricao } = req.body;

      if (!nome_localidade) {
        return res.status(400).json({ error: 'Nome da localidade é obrigatório.' });
      }

      const atualizado = await LocalidadeRepository.atualizar(id, { codigo, nome_localidade, descricao });

      if (!atualizado) {
        return res.status(404).json({ error: 'Localidade não encontrada.' });
      }

      const localidade = await LocalidadeRepository.buscarPorId(id);
      return res.status(200).json(localidade);
    } catch (error) {
      next(error);
    }
  }

  // ✅ DELETAR LOCALIDADE
  async deletar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const resultado = await LocalidadeRepository.deletar(id);

      if (!resultado.success) {
        return res.status(400).json({ error: resultado.message || 'Erro ao excluir localidade.' });
      }

      return res.status(200).json({ message: 'Localidade excluída com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new LocalidadeController();