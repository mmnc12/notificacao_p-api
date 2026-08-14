// ============================================
// src/controllers/GeolocalizacaoController.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import GeolocalizacaoService from '../services/GeolocalizacaoService';
import NotificacaoRepository from '../repositories/NotificacaoRepository';

class GeolocalizacaoController {
  /**
   * Buscar casos próximos a um ponto
   */
  async buscarProximos(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { lat, lng, raio = 50 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          error: 'Latitude e longitude são obrigatórios.'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          error: 'Latitude e longitude devem ser números válidos.'
        });
      }

      const casos = await GeolocalizacaoService.buscarCasosProximos(
        latitude,
        longitude,
        parseFloat(raio as string)
      );

      return res.status(200).json({
        ponto_referencia: { latitude, longitude },
        raio_metros: parseFloat(raio as string),
        total_encontrados: casos.length,
        casos
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar coordenadas de uma notificação
   */
  async atualizarCoordenadas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { latitude, longitude, link_google_earth } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: 'Latitude e longitude são obrigatórios.'
        });
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          error: 'Latitude e longitude devem ser números válidos.'
        });
      }

      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          error: 'Latitude deve estar entre -90 e 90 graus.'
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          error: 'Longitude deve estar entre -180 e 180 graus.'
        });
      }

      // Atualizar coordenadas
      const atualizado = await NotificacaoRepository.atualizarCoordenadas(
        id,
        latitude,
        longitude,
        link_google_earth
      );

      if (!atualizado) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      // Buscar notificação atualizada
      const notificacao = await NotificacaoRepository.buscarPorId(id);

      // Verificar automaticamente se precisa de bloqueio
      const bloqueio = await GeolocalizacaoService.verificarBloqueio(id);

      return res.status(200).json({
        message: 'Coordenadas atualizadas com sucesso.',
        notificacao,
        alerta_bloqueio: bloqueio.precisaBloqueio,
        motivo_bloqueio: bloqueio.motivo,
        casos_proximos: bloqueio.casosProximos
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar se uma notificação precisa de bloqueio
   */
  async verificarBloqueio(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const notificacao = await NotificacaoRepository.buscarPorId(id);
      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada.' });
      }

      const bloqueio = await GeolocalizacaoService.verificarBloqueio(id);

      return res.status(200).json({
        notificacao_id: id,
        notificacao: {
          nome_paciente: notificacao.nome_paciente,
          status: notificacao.status,
          resultado: notificacao.resultado,
          latitude: notificacao.latitude,
          longitude: notificacao.longitude,
          bloqueio_realizado: notificacao.bloqueio_realizado
        },
        ...bloqueio
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar todas as notificações com coordenadas para mapa
   */
  async listarParaMapa(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const casos = await GeolocalizacaoService.buscarAtivasComCoordenadas();

      const dados = casos.map(caso => ({
        id: caso.id,
        nome_paciente: caso.nome_paciente,
        latitude: caso.latitude,
        longitude: caso.longitude,
        status: caso.status,
        resultado: caso.resultado,
        suspeitas: {
          dengue: caso.suspeita_dengue,
          zika: caso.suspeita_zika,
          chikungunya: caso.suspeita_chikungunya
        },
        dt_primeiros_sintomas: caso.dt_primeiros_sintomas,
        localidade: caso.localidade_nome
      }));

      return res.status(200).json({
        total: dados.length,
        casos: dados
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new GeolocalizacaoController();