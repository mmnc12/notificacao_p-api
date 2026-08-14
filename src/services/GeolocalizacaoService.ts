// ============================================
// src/services/GeolocalizacaoService.ts
// ============================================

import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface INotificacaoComCoordenadas {
  id: number;
  nome_paciente: string;
  latitude: number;
  longitude: number;
  status: string;
  resultado: string;
  suspeita_dengue: boolean;
  suspeita_zika: boolean;
  suspeita_chikungunya: boolean;
  dt_primeiros_sintomas: string;
  localidade_id: number;
  localidade_nome: string;
}

interface ICasoProximo {
  id: number;
  nome_paciente: string;
  latitude: number;
  longitude: number;
  distancia_metros: number;
  status: string;
  resultado: string;
  suspeitas: string[];
  dt_primeiros_sintomas: string;
  localidade_nome: string;
}

class GeolocalizacaoService {
  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   * @returns Distância em metros
   */
  calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Retorna em metros
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Busca notificações ativas com coordenadas
   */
  async buscarAtivasComCoordenadas(): Promise<INotificacaoComCoordenadas[]> {
    const query = `
      SELECT 
        n.id,
        n.nome_paciente,
        n.latitude,
        n.longitude,
        n.status,
        n.resultado,
        n.suspeita_dengue,
        n.suspeita_zika,
        n.suspeita_chikungunya,
        n.dt_primeiros_sintomas,
        n.localidade_id,
        l.nome_localidade as localidade_nome
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE n.status = 'ATIVO'
        AND n.latitude IS NOT NULL
        AND n.longitude IS NOT NULL
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as INotificacaoComCoordenadas[];
  }

  /**
   * Busca casos próximos a um ponto
   */
  async buscarCasosProximos(
    latitude: number,
    longitude: number,
    raioMetros: number = 50,
    notificacaoId?: number
  ): Promise<ICasoProximo[]> {
    // Buscar todas as notificações ativas com coordenadas
    const todas = await this.buscarAtivasComCoordenadas();

    // Filtrar pela distância
    const resultados: ICasoProximo[] = [];

    for (const caso of todas) {
      // Excluir a própria notificação se fornecida
      if (notificacaoId && caso.id === notificacaoId) continue;

      const distancia = this.calcularDistancia(
        latitude,
        longitude,
        Number(caso.latitude),
        Number(caso.longitude)
      );

      if (distancia <= raioMetros) {
        const suspeitas = [];
        if (caso.suspeita_dengue) suspeitas.push('Dengue');
        if (caso.suspeita_zika) suspeitas.push('Zika');
        if (caso.suspeita_chikungunya) suspeitas.push('Chikungunya');

        resultados.push({
          id: caso.id,
          nome_paciente: caso.nome_paciente,
          latitude: Number(caso.latitude),
          longitude: Number(caso.longitude),
          distancia_metros: Math.round(distancia * 100) / 100,
          status: caso.status,
          resultado: caso.resultado,
          suspeitas,
          dt_primeiros_sintomas: caso.dt_primeiros_sintomas,
          localidade_nome: caso.localidade_nome
        });
      }
    }

    // Ordenar por distância (mais próximo primeiro)
    resultados.sort((a, b) => a.distancia_metros - b.distancia_metros);

    return resultados;
  }

  /**
   * Verifica se uma notificação precisa de bloqueio
   */
  async verificarBloqueio(
    notificacaoId: number
  ): Promise<{
    precisaBloqueio: boolean;
    motivo: string;
    casosProximos: ICasoProximo[];
  }> {
    // Buscar a notificação
    const query = `
      SELECT 
        id,
        nome_paciente,
        latitude,
        longitude,
        status,
        resultado,
        dt_primeiros_sintomas,
        bloqueio_realizado
      FROM notificacoes
      WHERE id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [notificacaoId]);

    if (rows.length === 0) {
      return {
        precisaBloqueio: false,
        motivo: 'Notificação não encontrada',
        casosProximos: []
      };
    }

    const notificacao = rows[0];

    // Se já está INATIVO, não precisa de bloqueio
    if (notificacao.status === 'INATIVO') {
      return {
        precisaBloqueio: false,
        motivo: 'Caso inativo (mais de 15 dias) - bloqueio não tem eficácia',
        casosProximos: []
      };
    }

    // Se já tem bloqueio realizado
    if (notificacao.bloqueio_realizado) {
      return {
        precisaBloqueio: false,
        motivo: 'Bloqueio já foi realizado para este caso',
        casosProximos: []
      };
    }

    // Verificar se tem coordenadas
    if (!notificacao.latitude || !notificacao.longitude) {
      return {
        precisaBloqueio: false,
        motivo: 'Coordenadas não registradas. Agente precisa visitar o local.',
        casosProximos: []
      };
    }

    // Buscar casos próximos
    const casosProximos = await this.buscarCasosProximos(
      Number(notificacao.latitude),
      Number(notificacao.longitude),
      50,
      notificacaoId
    );

    // Critério 1: Caso confirmado (POSITIVO)
    if (notificacao.resultado === 'POSITIVO') {
      return {
        precisaBloqueio: true,
        motivo: `Caso confirmado (POSITIVO) - bloqueio necessário. ${casosProximos.length} casos próximos encontrados.`,
        casosProximos
      };
    }

    // Critério 2: 2 ou mais casos ativos na região (incluindo o atual)
    if (casosProximos.length >= 1) { // +1 é a própria notificação = 2 casos
      return {
        precisaBloqueio: true,
        motivo: `${casosProximos.length + 1} casos ativos em um raio de 50m - bloqueio necessário`,
        casosProximos
      };
    }

    return {
      precisaBloqueio: false,
      motivo: 'Nenhum critério para bloqueio identificado',
      casosProximos
    };
  }

  /**
   * Obtém a localização atual do agente (simulado)
   * Na prática, isso viria do GPS do navegador/celular
   */
  async obterLocalizacaoAtual(): Promise<{ latitude: number; longitude: number }> {
    // Por enquanto, retorna uma localização padrão (São Paulo)
    // Em produção, isso viria do frontend via GPS
    return {
      latitude: -23.550520,
      longitude: -46.633308
    };
  }
}

export default new GeolocalizacaoService();