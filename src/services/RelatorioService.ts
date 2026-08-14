// ============================================
// src/services/RelatorioService.ts
// ============================================

import pool from '../config/database';
import { IRelatorioFiltros, IRelatorioEstatisticas } from '../interfaces/IRelatorio';
import { RowDataPacket } from 'mysql2';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

class RelatorioService {
  /**
   * Gerar relatório com filtros
   */
  async gerarRelatorio(filtros: IRelatorioFiltros): Promise<any[]> {
    let query = `
      SELECT 
        n.*,
        l.nome_localidade as localidade_nome
      FROM notificacoes n
      LEFT JOIN localidades l ON n.localidade_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Aplicar filtros
    if (filtros.nome) {
      query += ` AND n.nome_paciente LIKE ?`;
      params.push(`%${filtros.nome}%`);
    }

    if (filtros.localidade_id) {
      query += ` AND n.localidade_id = ?`;
      params.push(filtros.localidade_id);
    }

    if (filtros.status) {
      query += ` AND n.status = ?`;
      params.push(filtros.status);
    }

    if (filtros.ano) {
      query += ` AND YEAR(n.dt_notificacao) = ?`;
      params.push(filtros.ano);
    }

    if (filtros.mes) {
      query += ` AND MONTH(n.dt_notificacao) = ?`;
      params.push(filtros.mes);
    }

    if (filtros.dataInicio && filtros.dataFim) {
      query += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      params.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      query += ` AND n.dt_notificacao >= ?`;
      params.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      query += ` AND n.dt_notificacao <= ?`;
      params.push(filtros.dataFim);
    }

    if (filtros.resultado) {
      query += ` AND n.resultado = ?`;
      params.push(filtros.resultado);
    }

    if (filtros.suspeita_dengue !== undefined) {
      query += ` AND n.suspeita_dengue = ?`;
      params.push(filtros.suspeita_dengue);
    }

    if (filtros.suspeita_zika !== undefined) {
      query += ` AND n.suspeita_zika = ?`;
      params.push(filtros.suspeita_zika);
    }

    if (filtros.suspeita_chikungunya !== undefined) {
      query += ` AND n.suspeita_chikungunya = ?`;
      params.push(filtros.suspeita_chikungunya);
    }

    query += ` ORDER BY n.id DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  /**
   * Obter estatísticas
   */
  async obterEstatisticas(filtros: IRelatorioFiltros): Promise<IRelatorioEstatisticas> {
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ATIVO' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'INATIVO' THEN 1 ELSE 0 END) as inativos,
        SUM(CASE WHEN resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos,
        SUM(CASE WHEN resultado = 'NEGATIVO' THEN 1 ELSE 0 END) as negativos,
        SUM(CASE WHEN resultado = 'INCONCLUSIVO' THEN 1 ELSE 0 END) as inconclusivos,
        SUM(CASE WHEN resultado = 'AGUARDANDO' THEN 1 ELSE 0 END) as aguardando,
        SUM(CASE WHEN suspeita_dengue = TRUE THEN 1 ELSE 0 END) as suspeitas_dengue,
        SUM(CASE WHEN suspeita_zika = TRUE THEN 1 ELSE 0 END) as suspeitas_zika,
        SUM(CASE WHEN suspeita_chikungunya = TRUE THEN 1 ELSE 0 END) as suspeitas_chikungunya,
        SUM(CASE WHEN bloqueio_realizado = TRUE THEN 1 ELSE 0 END) as bloqueios_realizados,
        COUNT(DISTINCT localidade_id) as localidades_afetadas
      FROM notificacoes n
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      statsQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      params.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      statsQuery += ` AND n.dt_notificacao >= ?`;
      params.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      statsQuery += ` AND n.dt_notificacao <= ?`;
      params.push(filtros.dataFim);
    }

    if (filtros.ano) {
      statsQuery += ` AND YEAR(n.dt_notificacao) = ?`;
      params.push(filtros.ano);
    }

    if (filtros.status) {
      statsQuery += ` AND n.status = ?`;
      params.push(filtros.status);
    }

    if (filtros.localidade_id) {
      statsQuery += ` AND n.localidade_id = ?`;
      params.push(filtros.localidade_id);
    }

    const [stats] = await pool.query<RowDataPacket[]>(statsQuery, params);
    const estatisticas = stats[0] as any;

    // Estatísticas por localidade
    let localidadeQuery = `
      SELECT 
        l.id as localidade_id,
        l.nome_localidade as localidade_nome,
        COUNT(n.id) as total,
        SUM(CASE WHEN n.status = 'ATIVO' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN n.status = 'INATIVO' THEN 1 ELSE 0 END) as inativos,
        SUM(CASE WHEN n.resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos
      FROM localidades l
      LEFT JOIN notificacoes n ON l.id = n.localidade_id
      WHERE 1=1
    `;
    const localidadeParams: any[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      localidadeQuery += ` AND n.dt_notificacao BETWEEN ? AND ?`;
      localidadeParams.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      localidadeQuery += ` AND n.dt_notificacao >= ?`;
      localidadeParams.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      localidadeQuery += ` AND n.dt_notificacao <= ?`;
      localidadeParams.push(filtros.dataFim);
    }

    if (filtros.status) {
      localidadeQuery += ` AND n.status = ?`;
      localidadeParams.push(filtros.status);
    }

    if (filtros.localidade_id) {
      localidadeQuery += ` AND l.id = ?`;
      localidadeParams.push(filtros.localidade_id);
    }

    localidadeQuery += ` GROUP BY l.id, l.nome_localidade ORDER BY total DESC LIMIT 10`;

    const [porLocalidade] = await pool.query<RowDataPacket[]>(localidadeQuery, localidadeParams);

    // Estatísticas por mês
    let mesQuery = `
      SELECT 
        DATE_FORMAT(dt_notificacao, '%Y-%m') as mes,
        COUNT(*) as total,
        SUM(CASE WHEN resultado = 'POSITIVO' THEN 1 ELSE 0 END) as positivos
      FROM notificacoes n
      WHERE 1=1
    `;
    const mesParams: any[] = [];

    if (filtros.dataInicio && filtros.dataFim) {
      mesQuery += ` AND dt_notificacao BETWEEN ? AND ?`;
      mesParams.push(filtros.dataInicio, filtros.dataFim);
    } else if (filtros.dataInicio) {
      mesQuery += ` AND dt_notificacao >= ?`;
      mesParams.push(filtros.dataInicio);
    } else if (filtros.dataFim) {
      mesQuery += ` AND dt_notificacao <= ?`;
      mesParams.push(filtros.dataFim);
    }

    if (filtros.ano) {
      mesQuery += ` AND YEAR(dt_notificacao) = ?`;
      mesParams.push(filtros.ano);
    }

    mesQuery += ` GROUP BY DATE_FORMAT(dt_notificacao, '%Y-%m') ORDER BY mes DESC LIMIT 12`;

    const [porMes] = await pool.query<RowDataPacket[]>(mesQuery, mesParams);

    return {
      total: Number(estatisticas.total) || 0,
      ativos: Number(estatisticas.ativos) || 0,
      inativos: Number(estatisticas.inativos) || 0,
      positivos: Number(estatisticas.positivos) || 0,
      negativos: Number(estatisticas.negativos) || 0,
      inconclusivos: Number(estatisticas.inconclusivos) || 0,
      aguardando: Number(estatisticas.aguardando) || 0,
      suspeitas_dengue: Number(estatisticas.suspeitas_dengue) || 0,
      suspeitas_zika: Number(estatisticas.suspeitas_zika) || 0,
      suspeitas_chikungunya: Number(estatisticas.suspeitas_chikungunya) || 0,
      bloqueios_realizados: Number(estatisticas.bloqueios_realizados) || 0,
      localidades_afetadas: Number(estatisticas.localidades_afetadas) || 0,
      por_localidade: porLocalidade as any[],
      por_mes: porMes as any[]
    };
  }

  /**
   * Exportar para Excel
   */
  async exportarExcel(dados: any[], res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Notificações');

    // Definir colunas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Paciente', key: 'nome_paciente', width: 30 },
      { header: 'Mãe', key: 'nome_mae', width: 30 },
      { header: 'Localidade', key: 'localidade_nome', width: 25 },
      { header: 'Endereço', key: 'endereco', width: 30 },
      { header: '1ºs Sintomas', key: 'dt_primeiros_sintomas', width: 15 },
      { header: 'Notificação', key: 'dt_notificacao', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Resultado', key: 'resultado', width: 15 },
      { header: 'Data Resultado', key: 'dt_resultado', width: 15 },
      { header: 'Dengue', key: 'suspeita_dengue', width: 10 },
      { header: 'Zika', key: 'suspeita_zika', width: 10 },
      { header: 'Chikungunya', key: 'suspeita_chikungunya', width: 15 },
      { header: 'Bloqueio', key: 'bloqueio_realizado', width: 12 }
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Adicionar dados
    dados.forEach(item => {
      worksheet.addRow({
        id: item.id,
        nome_paciente: item.nome_paciente,
        nome_mae: item.nome_mae,
        localidade_nome: item.localidade_nome,
        endereco: item.endereco || 'Não informado',
        dt_primeiros_sintomas: item.dt_primeiros_sintomas,
        dt_notificacao: item.dt_notificacao,
        status: item.status,
        resultado: item.resultado || 'Aguardando',
        dt_resultado: item.dt_resultado || '',
        suspeita_dengue: item.suspeita_dengue ? 'Sim' : 'Não',
        suspeita_zika: item.suspeita_zika ? 'Sim' : 'Não',
        suspeita_chikungunya: item.suspeita_chikungunya ? 'Sim' : 'Não',
        bloqueio_realizado: item.bloqueio_realizado ? 'Sim' : 'Não'
      });
    });

    // Configurar headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Exportar para PDF
   */
  async exportarPDF(dados: any[], res: Response): Promise<void> {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Relatório de Notificações de Arboviroses', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.text(`Total de registros: ${dados.length}`, { align: 'center' });
    doc.moveDown(1.5);

    // Dados em tabela
    dados.forEach((item, index) => {
      if (index > 0 && index % 20 === 0) {
        doc.addPage();
      }

      const suspeitas = [];
      if (item.suspeita_dengue) suspeitas.push('Dengue');
      if (item.suspeita_zika) suspeitas.push('Zika');
      if (item.suspeita_chikungunya) suspeitas.push('Chikungunya');

      doc.fontSize(11).fillColor('#1E3A8A').text(`${index + 1}. ${item.nome_paciente}`);
      doc.fontSize(9).fillColor('#000000');
      doc.text(`   Mãe: ${item.nome_mae}`);
      doc.text(`   Localidade: ${item.localidade_nome}`);
      doc.text(`   Endereço: ${item.endereco || 'Não informado'}`);
      doc.text(`   1ºs Sintomas: ${item.dt_primeiros_sintomas} | Notificação: ${item.dt_notificacao}`);
      doc.text(`   Status: ${item.status} | Resultado: ${item.resultado || 'Aguardando'}`);
      doc.text(`   Suspeitas: ${suspeitas.join(', ') || 'Nenhuma'}`);
      doc.text(`   Bloqueio: ${item.bloqueio_realizado ? 'Realizado' : 'Não realizado'}`);
      doc.moveDown(0.8);
    });

    doc.end();
  }

  /**
   * Exportar para CSV
   */
  async exportarCSV(dados: any[], res: Response): Promise<void> {
    const headers = [
      'ID',
      'Paciente',
      'Mãe',
      'Localidade',
      'Endereço',
      '1ºs Sintomas',
      'Notificação',
      'Status',
      'Resultado',
      'Dengue',
      'Zika',
      'Chikungunya',
      'Bloqueio'
    ];

    let csv = headers.join(',') + '\n';

    dados.forEach(item => {
      const row = [
        item.id,
        `"${item.nome_paciente}"`,
        `"${item.nome_mae}"`,
        `"${item.localidade_nome}"`,
        `"${item.endereco || ''}"`,
        item.dt_primeiros_sintomas,
        item.dt_notificacao,
        item.status,
        item.resultado || 'Aguardando',
        item.suspeita_dengue ? 'Sim' : 'Não',
        item.suspeita_zika ? 'Sim' : 'Não',
        item.suspeita_chikungunya ? 'Sim' : 'Não',
        item.bloqueio_realizado ? 'Sim' : 'Não'
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csv);
  }
}

export default new RelatorioService();