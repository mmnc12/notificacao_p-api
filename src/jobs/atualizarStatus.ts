// ============================================
// src/jobs/atualizarStatus.ts
// ============================================

import cron from 'node-cron';
import pool from '../config/database';

/**
 * ✅ Job para atualizar automaticamente o status
 * Roda todo dia à meia-noite (00:00)
 */
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 [CRON] Iniciando atualização automática de status...');
  console.log(`📅 Data da execução: ${new Date().toLocaleString('pt-BR')}`);
  
  try {
    // 1. Verificar quantos registros serão afetados
    const [checkRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM notificacoes 
      WHERE DATEDIFF(CURDATE(), dt_primeiros_sintomas) > 15 
        AND status = 'ATIVO'
    `);
    
    const total = (checkRows as any[])[0]?.total || 0;
    
    if (total === 0) {
      console.log('✅ [CRON] Nenhum registro precisa ser atualizado.');
      return;
    }
    
    console.log(`📊 [CRON] ${total} registro(s) serão atualizados para INATIVO`);
    
    // 2. Atualizar os registros
    const [result] = await pool.query(`
      UPDATE notificacoes 
      SET status = 'INATIVO' 
      WHERE DATEDIFF(CURDATE(), dt_primeiros_sintomas) > 15 
        AND status = 'ATIVO'
    `);
    
    console.log(`✅ [CRON] ${total} registro(s) atualizados com sucesso!`);
    
  } catch (error) {
    console.error('❌ [CRON] Erro ao atualizar status:', error);
  }
});

console.log('⏰ [CRON] Job de atualização de status agendado para meia-noite!');