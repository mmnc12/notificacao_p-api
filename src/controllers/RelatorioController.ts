// ============================================
// src/controllers/RelatorioController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import RelatorioService from '../services/RelatorioService';
import { IRelatorioFiltros } from '../interfaces/IRelatorio';

class RelatorioController {
  /**
   * Gerar relatório com filtros (JSON)
   */
  async gerarRelatorio(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const filtros: IRelatorioFiltros = {
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
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        orderBy: req.query.orderBy as string,
        orderDirection: req.query.orderDirection as 'ASC' | 'DESC'
      };

      const dados = await RelatorioService.gerarRelatorio(filtros);
      const estatisticas = await RelatorioService.obterEstatisticas(filtros);

      return res.status(200).json({
        dados,
        estatisticas,
        total: dados.length,
        filtros_aplicados: filtros
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter apenas estatísticas
   */
  async obterEstatisticas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const filtros: IRelatorioFiltros = {
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
        ano: req.query.ano ? Number(req.query.ano) : undefined,
        status: req.query.status as 'ATIVO' | 'INATIVO',
        localidade_id: req.query.localidade_id ? Number(req.query.localidade_id) : undefined
      };

      const estatisticas = await RelatorioService.obterEstatisticas(filtros);
      return res.status(200).json(estatisticas);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Exportar relatório para Excel
   */
  async exportarExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros: IRelatorioFiltros = {
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

      const dados = await RelatorioService.gerarRelatorio(filtros);
      await RelatorioService.exportarExcel(dados, res);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Exportar relatório para PDF
   */
  async exportarPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros: IRelatorioFiltros = {
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

      const dados = await RelatorioService.gerarRelatorio(filtros);
      await RelatorioService.exportarPDF(dados, res);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Exportar relatório para CSV
   */
  async exportarCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros: IRelatorioFiltros = {
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

      const dados = await RelatorioService.gerarRelatorio(filtros);
      await RelatorioService.exportarCSV(dados, res);

    } catch (error) {
      next(error);
    }
  }
}

export default new RelatorioController();