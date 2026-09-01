// ============================================
// src/controllers/NotificacaoController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import NotificacaoRepository from '../repositories/NotificacaoRepository';
import { INotificacaoInput, INotificacaoFiltros } from '../interfaces/INotificacao';

class NotificacaoController {
  /**
   * Listar notificações com filtros e paginação
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
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const { dados, total } = await NotificacaoRepository.listarComFiltros(filtros);

      const page = filtros.page || 1;
      const limit = filtros.limit || 10;

      return res.status(200).json({
        dados,
        paginacao: {
          total,
          pagina: page,
          limite: limit,
          totalPaginas: Math.ceil(total / limit)
        }
      });

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
   * ✅ Função para calcular dias entre duas datas
   */
  private calcularDias(dataSintomas: string): number {
    if (!dataSintomas) return 999;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const data = new Date(dataSintomas + 'T00:00:00-03:00');
    if (isNaN(data.getTime())) return 0;

    const diffTime = Math.abs(hoje.getTime() - data.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Criar nova notificação
   */
  async criar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const dados: INotificacaoInput = req.body;
       console.log('📥 [CRIAR] Dados recebidos:', JSON.stringify(dados));

      // Validações básicas
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

      // ✅ VALIDAÇÕES DE DATAS FUTURAS
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (new Date(dados.dt_primeiros_sintomas) > hoje) {
        return res.status(400).json({ error: 'A data dos primeiros sintomas não pode ser futura.' });
      }

      if (new Date(dados.dt_notificacao) > hoje) {
        return res.status(400).json({ error: 'A data da notificação não pode ser futura.' });
      }

      if (dados.dt_recebimento && new Date(dados.dt_recebimento) > hoje) {
        return res.status(400).json({ error: 'A data de recebimento não pode ser futura.' });
      }

      // Validar: data da notificação não pode ser anterior aos primeiros sintomas
      if (new Date(dados.dt_notificacao) < new Date(dados.dt_primeiros_sintomas)) {
        return res.status(400).json({
          error: 'A data da notificação não pode ser anterior aos primeiros sintomas.'
        });
      }

      // Validar: pelo menos uma suspeita
      if (!dados.suspeita_dengue && !dados.suspeita_zika && !dados.suspeita_chikungunya) {
        return res.status(400).json({
          error: 'Selecione pelo menos uma suspeita (Dengue, Zika ou Chikungunya).'
        });
      }

      console.log('✅ [CRIAR] Validações passadas');

      // ✅ CALCULAR O STATUS
      const dias = this.calcularDias(dados.dt_primeiros_sintomas);
      console.log('📊 [CRIAR] Dias:', dias);
      dados.status = dias > 15 ? 'INATIVO' : 'ATIVO';
      console.log('📊 [CRIAR] Status:', dados.status);

      const insertId = await NotificacaoRepository.criar(dados);
      console.log('✅ [CRIAR] Insert ID:', insertId);
      const novaNotificacao = await NotificacaoRepository.buscarPorId(insertId);
      console.log('✅ [CRIAR] Notificação criada:', JSON.stringify(novaNotificacao));

      return res.status(201).json(novaNotificacao);

    } catch (error) {
      console.error('❌ Erro no criar:', error);
      console.error('❌ [CRIAR] Stack:', error instanceof Error ? error.stack : 'Sem stack');
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

      // ✅ VALIDAÇÕES DE DATAS FUTURAS
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (new Date(dados.dt_primeiros_sintomas) > hoje) {
        return res.status(400).json({ error: 'A data dos primeiros sintomas não pode ser futura.' });
      }

      if (new Date(dados.dt_notificacao) > hoje) {
        return res.status(400).json({ error: 'A data da notificação não pode ser futura.' });
      }

      if (dados.dt_recebimento && new Date(dados.dt_recebimento) > hoje) {
        return res.status(400).json({ error: 'A data de recebimento não pode ser futura.' });
      }

      // Validar: pelo menos uma suspeita
      if (!dados.suspeita_dengue && !dados.suspeita_zika && !dados.suspeita_chikungunya) {
        return res.status(400).json({
          error: 'Selecione pelo menos uma suspeita (Dengue, Zika ou Chikungunya).'
        });
      }

      // Validar: data da notificação não pode ser anterior aos primeiros sintomas
      if (new Date(dados.dt_notificacao) < new Date(dados.dt_primeiros_sintomas)) {
        return res.status(400).json({
          error: 'A data da notificação não pode ser anterior aos primeiros sintomas.'
        });
      }

      // ✅ CALCULAR O STATUS
      const dias = this.calcularDias(dados.dt_primeiros_sintomas);
      dados.status = dias > 15 ? 'INATIVO' : 'ATIVO';

      const atualizado = await NotificacaoRepository.atualizar(id, dados);
      if (!atualizado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      const notificacaoAtualizada = await NotificacaoRepository.buscarPorId(id);
      return res.status(200).json(notificacaoAtualizada);

    } catch (error) {
      console.error('❌ Erro no atualizar:', error);
      next(error);
    }
  }

  /**
   * Atualizar apenas a data de recebimento
   */
  async atualizarRecebimento(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { dt_recebimento } = req.body;

      if (dt_recebimento !== null && dt_recebimento !== undefined) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataRecebimento = new Date(dt_recebimento);

        if (isNaN(dataRecebimento.getTime())) {
          return res.status(400).json({ error: 'Data de recebimento inválida.' });
        }

        if (dataRecebimento > hoje) {
          return res.status(400).json({ error: 'A data de recebimento não pode ser futura.' });
        }
      }

      const atualizado = await NotificacaoRepository.atualizarRecebimento(id, dt_recebimento || null);

      if (!atualizado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      const notificacao = await NotificacaoRepository.buscarPorId(id);
      return res.status(200).json({
        message: 'Data de recebimento atualizada com sucesso.',
        notificacao
      });

    } catch (error) {
      console.error('❌ Erro no atualizarRecebimento:', error);
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
      console.error('❌ Erro no deletar:', error);
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
      console.error('❌ Erro no registrarBloqueio:', error);
      next(error);
    }
  }
}

export default new NotificacaoController();