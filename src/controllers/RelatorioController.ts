import { Request, Response } from 'express';
import { RelatorioService } from '../services/RelatorioService';

const relatorioService = new RelatorioService();

export class RelatorioController {
  static async getDados(req: Request, res: Response): Promise<Response> {
    try {
      const { localidade_id, data_inicio, data_fim } = req.query;

      const filters: any = {};
      if (localidade_id) filters.localidade_id = Number(localidade_id);
      if (data_inicio) filters.data_inicio = data_inicio;
      if (data_fim) filters.data_fim = data_fim;

      const dados = await relatorioService.getDadosRelatorio(filters);
      const estatisticas = await relatorioService.getEstatisticas(filters);
      const porLocalidade = await relatorioService.getPorLocalidade(filters);
      const porMes = await relatorioService.getPorMes(filters);

      return res.json({
        success: true,
        data: {
          dados,
          estatisticas,
          porLocalidade,
          porMes
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async gerarExcel(req: Request, res: Response): Promise<void> {
    try {
      const { localidade_id, data_inicio, data_fim } = req.query;

      const filters: any = {};
      if (localidade_id) filters.localidade_id = Number(localidade_id);
      if (data_inicio) filters.data_inicio = data_inicio;
      if (data_fim) filters.data_fim = data_fim;

      await relatorioService.gerarExcel(filters, res);
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async gerarPDF(req: Request, res: Response): Promise<void> {
    try {
      const { localidade_id, data_inicio, data_fim } = req.query;

      const filters: any = {};
      if (localidade_id) filters.localidade_id = Number(localidade_id);
      if (data_inicio) filters.data_inicio = data_inicio;
      if (data_fim) filters.data_fim = data_fim;

      await relatorioService.gerarPDF(filters, res);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}