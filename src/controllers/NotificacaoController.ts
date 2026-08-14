// ============================================
// src/controllers/NotificacaoController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import NotificacaoRepository from '../repositories/NotificacaoRepository';
import { INotificacaoInput, INotificacaoFiltros } from '../interfaces/INotificacao';

class NotificacaoController {
  /**
   * Listar notificações com filtros
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const filtros: INotificacaoFiltros = {
        nome: req.query.nome as string,
        localidade_id: req.query.localidade_id ? Number(req.query.localidade_id) : undefined,
        status: req.query.status as 'ATIVO' | 'INATIVO',
        ano: req.query.ano ? Number(req.query.ano) : undefined,
        mes: req.query.mes ? Number(req.query.mes) : undefined,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
        resultado: req.query.resultado as 'POSITIVO' | 'NEGATIVO' | 'INCONCLUSIVO' | 'AGUARDANDO',
        suspeita_dengue: req.query.suspeita_dengue === 'true' ? true : req.query.suspeita_dengue === 'false' ? false : undefined,
        suspeita_zika: req.query.suspeita_zika === 'true' ? true : req.query.suspeita_zika === 'false' ? false : undefined,
        suspeita_chikungunya: req.query.suspeita_chikungunya === 'true' ? true : req.query.suspeita_chikungunya === 'false' ? false : undefined,
      };

      const notificacoes = await NotificacaoRepository.listarComFiltros(filtros);
      return res.status(200).json(notificacoes);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar notificação por ID
   */
  async buscarPorId(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const notificacao = await NotificacaoRepository.buscarPorId(id);
      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      return res.status(200).json(notificacao);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar nova notificação
   */
  async criar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const dados: INotificacaoInput = req.body;

      // Validações
      if (!dados.dt_primeiros_sintomas) {
        return res.status(400).json({ error: 'Data dos primeiros sintomas é obrigatória.' });
      }
      if (!dados.nome_paciente) {
        return res.status(400).json({ error: 'Nome do paciente é obrigatório.' });
      }
      if (!dados.nome_mae) {
        return res.status(400).json({ error: 'Nome da mãe é obrigatório.' });
      }
      if (!dados.localidade_id) {
        return res.status(400).json({ error: 'Localidade é obrigatória.' });
      }
      if (!dados.dt_notificacao) {
        return res.status(400).json({ error: 'Data da notificação é obrigatória.' });
      }
      if (!dados.dt_recebimento) {
        return res.status(400).json({ error: 'Data de recebimento é obrigatória.' });
      }

      // Validar: pelo menos uma suspeita
      if (!dados.suspeita_dengue && !dados.suspeita_zika && !dados.suspeita_chikungunya) {
        return res.status(400).json({ 
          error: 'Selecione pelo menos uma suspeita (Dengue, Zika ou Chikungunya).' 
        });
      }

      const insertId = await NotificacaoRepository.criar(dados);
      const novaNotificacao = await NotificacaoRepository.buscarPorId(insertId);

      return res.status(201).json(novaNotificacao);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar notificação
   */
  async atualizar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const dados: INotificacaoInput = req.body;

      // Validações
      if (!dados.dt_primeiros_sintomas) {
        return res.status(400).json({ error: 'Data dos primeiros sintomas é obrigatória.' });
      }
      if (!dados.nome_paciente) {
        return res.status(400).json({ error: 'Nome do paciente é obrigatório.' });
      }
      if (!dados.nome_mae) {
        return res.status(400).json({ error: 'Nome da mãe é obrigatório.' });
      }
      if (!dados.localidade_id) {
        return res.status(400).json({ error: 'Localidade é obrigatória.' });
      }
      if (!dados.dt_notificacao) {
        return res.status(400).json({ error: 'Data da notificação é obrigatória.' });
      }
      if (!dados.dt_recebimento) {
        return res.status(400).json({ error: 'Data de recebimento é obrigatória.' });
      }

      // Validar: pelo menos uma suspeita
      if (!dados.suspeita_dengue && !dados.suspeita_zika && !dados.suspeita_chikungunya) {
        return res.status(400).json({ 
          error: 'Selecione pelo menos uma suspeita (Dengue, Zika ou Chikungunya).' 
        });
      }

      const atualizado = await NotificacaoRepository.atualizar(id, dados);
      if (!atualizado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      const notificacaoAtualizada = await NotificacaoRepository.buscarPorId(id);
      return res.status(200).json(notificacaoAtualizada);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar notificação
   */
  async deletar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const deletado = await NotificacaoRepository.deletar(id);
      if (!deletado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      return res.status(200).json({ message: 'Notificação excluída com sucesso.' });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar bloqueio
   */
  async registrarBloqueio(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { observacoes } = req.body;

      const registrado = await NotificacaoRepository.registrarBloqueio(id, observacoes);
      if (!registrado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      return res.status(200).json({ 
        message: 'Bloqueio registrado com sucesso.',
        notificacao_id: id,
        dt_bloqueio: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new NotificacaoController();