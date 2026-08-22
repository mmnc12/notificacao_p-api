// ============================================
// src/services/RelatorioService.ts
// ============================================

import pool from '../config/database';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';

const ITEMS_PER_PAGE = 20; // Registros por página

// ============================================
// INTERFACES
// ============================================

interface Notificacao {
  id: number;
  dt_primeiros_sintomas: Date;
  nome_paciente: string;
  nome_mae: string;
  endereco: string;
  endereco_completo: string;
  localidade_id: number;
  latitude: number;
  longitude: number;
  link_google_earth: string;
  dt_notificacao: Date;
  dt_recebimento: Date;
  status: string;
  suspeita_dengue: number;
  suspeita_zika: number;
  suspeita_chikungunya: number;
  resultado: string;
  dt_resultado: Date;
  bloqueio_realizado: number;
  dt_bloqueio: Date;
  observacoes_bloqueio: string;
  observacoes: string;
  created_at: Date;
  updated_at: Date;
  localidade?: string;
}

interface Estatisticas {
  total: number;
  total_localidades: number;
  primeira_notificacao: Date | null;
  ultima_notificacao: Date | null;
}

interface LocalidadeCount {
  localidade: string;
  total: number;
}

interface MesCount {
  mes: string;
  total: number;
}

// ============================================
// RELATÓRIO SERVICE
// ============================================

export class RelatorioService {
  
  // ============================================
  // BUSCAR DADOS
  // ============================================

  async getDadosRelatorio(filters?: any): Promise<Notificacao[]> {
    let query = 'SELECT * FROM notificacoes';
    const params: any[] = [];

    if (filters) {
      const conditions: string[] = [];
      if (filters.localidade_id) {
        conditions.push('localidade_id = ?');
        params.push(filters.localidade_id);
      }
      if (filters.data_inicio) {
        conditions.push('dt_recebimento >= ?');
        params.push(filters.data_inicio);
      }
      if (filters.data_fim) {
        conditions.push('dt_recebimento <= ?');
        params.push(filters.data_fim);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }

    query += ' ORDER BY dt_recebimento DESC';
    
    // ✅ CORREÇÃO: Usar cast para any[] com RowDataPacket[]
    const [rows] = await pool.query<any[]>(query, params);
    return rows || [];
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  async getEstatisticas(filters?: any): Promise<Estatisticas> {
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT localidade_id) as total_localidades,
        MIN(dt_recebimento) as primeira_notificacao,
        MAX(dt_recebimento) as ultima_notificacao
      FROM notificacoes
    `;
    const params: any[] = [];

    if (filters) {
      const conditions: string[] = [];
      if (filters.localidade_id) {
        conditions.push('localidade_id = ?');
        params.push(filters.localidade_id);
      }
      if (filters.data_inicio) {
        conditions.push('dt_recebimento >= ?');
        params.push(filters.data_inicio);
      }
      if (filters.data_fim) {
        conditions.push('dt_recebimento <= ?');
        params.push(filters.data_fim);
      }
      if (conditions.length > 0) {
        statsQuery += ' WHERE ' + conditions.join(' AND ');
      }
    }

    // ✅ CORREÇÃO: Usar cast para any[]
    const [rows] = await pool.query<any[]>(statsQuery, params);
    
    const stats = rows[0] as Estatisticas;
    return stats || { total: 0, total_localidades: 0, primeira_notificacao: null, ultima_notificacao: null };
  }

  // ============================================
  // POR LOCALIDADE
  // ============================================

  async getPorLocalidade(filters?: any): Promise<LocalidadeCount[]> {
    let localidadeQuery = `
      SELECT 
        l.nome_localidade as localidade,
        COUNT(n.id) as total
      FROM localidades l
      LEFT JOIN notificacoes n ON l.id = n.localidade_id
    `;
    const localidadeParams: any[] = [];

    if (filters) {
      const conditions: string[] = [];
      if (filters.localidade_id) {
        conditions.push('l.id = ?');
        localidadeParams.push(filters.localidade_id);
      }
      if (filters.data_inicio) {
        conditions.push('n.dt_recebimento >= ?');
        localidadeParams.push(filters.data_inicio);
      }
      if (filters.data_fim) {
        conditions.push('n.dt_recebimento <= ?');
        localidadeParams.push(filters.data_fim);
      }
      if (conditions.length > 0) {
        localidadeQuery += ' WHERE ' + conditions.join(' AND ');
      }
    }

    localidadeQuery += ' GROUP BY l.id ORDER BY total DESC';
    
    // ✅ CORREÇÃO: Usar cast para any[]
    const [rows] = await pool.query<any[]>(localidadeQuery, localidadeParams);
    return rows as LocalidadeCount[] || [];
  }

  // ============================================
  // POR MÊS
  // ============================================

  async getPorMes(filters?: any): Promise<MesCount[]> {
    let mesQuery = `
      SELECT 
        DATE_FORMAT(dt_recebimento, '%Y-%m') as mes,
        COUNT(*) as total
      FROM notificacoes
    `;
    const mesParams: any[] = [];

    if (filters) {
      const conditions: string[] = [];
      if (filters.localidade_id) {
        conditions.push('localidade_id = ?');
        mesParams.push(filters.localidade_id);
      }
      if (filters.data_inicio) {
        conditions.push('dt_recebimento >= ?');
        mesParams.push(filters.data_inicio);
      }
      if (filters.data_fim) {
        conditions.push('dt_recebimento <= ?');
        mesParams.push(filters.data_fim);
      }
      if (conditions.length > 0) {
        mesQuery += ' WHERE ' + conditions.join(' AND ');
      }
    }

    mesQuery += ' GROUP BY mes ORDER BY mes';
    
    // ✅ CORREÇÃO: Usar cast para any[]
    const [rows] = await pool.query<any[]>(mesQuery, mesParams);
    return rows as MesCount[] || [];
  }

  // ============================================
  // GERAR EXCEL
  // ============================================

  async gerarExcel(filters: any, res: Response): Promise<void> {
    try {
      const dados = await this.getDadosRelatorio(filters);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Notificações');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Paciente', key: 'nome_paciente', width: 30 },
        { header: 'Localidade', key: 'localidade', width: 30 },
        { header: 'Data de Recebimento', key: 'dt_recebimento', width: 20 },
        { header: 'Data Notificação', key: 'dt_notificacao', width: 20 },
        { header: 'Resultado', key: 'resultado', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Observações', key: 'observacoes', width: 40 },
      ];

      worksheet.addRows(dados);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      throw error;
    }
  }

  // ============================================
  // GERAR PDF - VERSÃO PROFISSIONAL
  // ============================================

  async gerarPDF(filters: any, res: Response): Promise<void> {
    try {
      const dados = await this.getDadosRelatorio(filters);
      const estatisticas = await this.getEstatisticas(filters);
      const porLocalidade = await this.getPorLocalidade(filters);

      // Criar documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Relatório de Notificações - Arboviroses',
          Author: 'Secretaria Municipal de Saúde',
          Subject: 'Relatório de Notificações'
        }
      });

      const fileName = `relatorio_${new Date().toISOString().slice(0,10)}.pdf`;
      const filePath = path.join(__dirname, '..', '..', 'temp', fileName);

      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ============================================
      // CABEÇALHO COM LOGO
      // ============================================

      const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
      let logoWidth = 0;
      
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 60 });
        logoWidth = 60;
      }

      const titleX = logoWidth > 0 ? 130 : 50;
      
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('PREFEITURA MUNICIPAL DE PINDOBAÇU', titleX, 45, { align: 'left' })
        .moveDown(0.2);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text('SECRETARIA MUNICIPAL DE SAÚDE', titleX, doc.y, { align: 'left' })
        .moveDown(0.2);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#2c3e50')
        .text('SETOR DE ENDEMIAS', titleX, doc.y, { align: 'left' })
        .moveDown(0.5);

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#1a5276')
        .lineWidth(1.5)
        .stroke()
        .moveDown(0.5);

      // ============================================
      // FUNÇÃO PARA RENDERIZAR CONTEÚDO POR PÁGINA
      // ============================================

      const renderPageContent = (
        dadosPaginados: any[],
        pageNumber: number,
        totalPages: number,
        totalRegistros: number
      ) => {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text('📊 RELATÓRIO DE NOTIFICAÇÕES', { align: 'center' })
          .moveDown(0.3);

        const dataAtual = new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#7f8c8d')
          .text(`Gerado em: ${dataAtual}`, { align: 'center' })
          .moveDown(0.3);

        let filtrosTexto = 'Todos os registros';
        if (filters.localidade_id) {
          filtrosTexto = `Localidade ID: ${filters.localidade_id}`;
        }
        if (filters.data_inicio && filters.data_fim) {
          const inicio = new Date(filters.data_inicio).toLocaleDateString('pt-BR');
          const fim = new Date(filters.data_fim).toLocaleDateString('pt-BR');
          filtrosTexto += ` | Período: ${inicio} a ${fim}`;
        }

        doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .fillColor('#7f8c8d')
          .text(`Filtros: ${filtrosTexto}`, { align: 'center' })
          .moveDown(0.5);

        if (pageNumber === 1) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#1a5276')
            .text('📈 Resumo Estatístico', { underline: true })
            .moveDown(0.3);

          const stats = [
            { label: 'Total de Notificações', value: estatisticas?.total || 0 },
            { label: 'Localidades Afetadas', value: estatisticas?.total_localidades || 0 },
            { label: 'Primeira Notificação', value: estatisticas?.primeira_notificacao ?
              new Date(estatisticas.primeira_notificacao).toLocaleDateString('pt-BR') : 'N/A' },
            { label: 'Última Notificação', value: estatisticas?.ultima_notificacao ?
              new Date(estatisticas.ultima_notificacao).toLocaleDateString('pt-BR') : 'N/A' }
          ];

          const colWidth = 130;
          stats.forEach((stat, index) => {
            const xPos = 50 + (index * colWidth);
            doc
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#2c3e50')
              .text(stat.label, xPos, doc.y, { width: colWidth - 10, align: 'center' })
              .fontSize(12)
              .font('Helvetica-Bold')
              .fillColor('#1a5276')
              .text(String(stat.value), xPos, doc.y + 12, { width: colWidth - 10, align: 'center' });
          });

          doc.moveDown(2);

          if (porLocalidade && porLocalidade.length > 0) {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor('#1a5276')
              .text('📍 Localidades com Mais Notificações', { underline: true })
              .moveDown(0.3);

            const topLocalidades = porLocalidade.slice(0, 5);
            topLocalidades.forEach((item: any, index: number) => {
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#2c3e50')
                .text(
                  `${index + 1}. ${item.localidade || 'Não informada'}`,
                  50,
                  doc.y,
                  { continued: true }
                )
                .font('Helvetica-Bold')
                .text(` ${item.total} notificações`, { align: 'right' });
            });
            doc.moveDown(1);
          }
        }

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1a5276')
          .text(`📋 Detalhamento das Notificações (Pág. ${pageNumber}/${totalPages})`, { underline: true })
          .moveDown(0.3);

        const tableTop = doc.y;
        const colPositions = {
          id: 50,
          localidade: 100,
          data: 230,
          paciente: 330,
          resultado: 430
        };

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .rect(50, tableTop - 2, 495, 18)
          .fill('#1a5276')
          .fillColor('#ffffff')
          .text('ID', colPositions.id + 5, tableTop + 2)
          .text('Localidade', colPositions.localidade + 5, tableTop + 2, { width: 120 })
          .text('Data', colPositions.data + 5, tableTop + 2)
          .text('Paciente', colPositions.paciente + 5, tableTop + 2, { width: 90 })
          .text('Resultado', colPositions.resultado + 5, tableTop + 2, { width: 60 });

        let currentY = tableTop + 20;

        dadosPaginados.forEach((item: any, index: number) => {
          const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
          
          doc
            .rect(50, currentY - 2, 495, 14)
            .fill(bgColor)
            .fontSize(6)
            .font('Helvetica')
            .fillColor('#2c3e50')
            .text(item.id || '', colPositions.id + 5, currentY)
            .text(item.localidade || '', colPositions.localidade + 5, currentY, { width: 120 })
            .text(
              item.dt_recebimento ?
                new Date(item.dt_recebimento).toLocaleDateString('pt-BR') :
                item.dt_notificacao ?
                  new Date(item.dt_notificacao).toLocaleDateString('pt-BR') :
                  '',
              colPositions.data + 5,
              currentY
            )
            .text((item.nome_paciente || '').slice(0, 20), colPositions.paciente + 5, currentY, { width: 90 })
            .text(item.resultado || 'AGUARDANDO', colPositions.resultado + 5, currentY, { width: 60 });

          currentY += 14;
        });

        doc
          .fontSize(7)
          .font('Helvetica-Oblique')
          .fillColor('#7f8c8d')
          .text(
            `Exibindo ${dadosPaginados.length} registros (Total: ${totalRegistros})`,
            50,
            currentY + 5
          );
      };

      // ============================================
      // PAGINAÇÃO
      // ============================================

      const totalRegistros = dados.length;
      const totalPages = Math.ceil(totalRegistros / ITEMS_PER_PAGE) || 1;

      for (let page = 0; page < totalPages; page++) {
        const start = page * ITEMS_PER_PAGE;
        const end = Math.min(start + ITEMS_PER_PAGE, totalRegistros);
        const dadosPagina = dados.slice(start, end);

        if (page > 0) {
          doc.addPage();
        }

        renderPageContent(dadosPagina, page + 1, totalPages, totalRegistros);

        const pageHeight = doc.page.height;
        doc
          .moveTo(50, pageHeight - 40)
          .lineTo(545, pageHeight - 40)
          .strokeColor('#bdc3c7')
          .lineWidth(1)
          .stroke();

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#7f8c8d')
          .text(
            `Secretaria Municipal de Saúde • Setor de Endemias • Página ${page + 1} de ${totalPages}`,
            50,
            pageHeight - 30,
            { align: 'center' }
          );

        doc
          .fontSize(6)
          .font('Helvetica')
          .fillColor('#bdc3c7')
          .text(
            `Relatório gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            50,
            pageHeight - 20,
            { align: 'center' }
          );
      }

      doc.end();

      await new Promise<void>((resolve) => {
        writeStream.on('finish', () => resolve());
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.sendFile(filePath);

      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 10000);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }
}