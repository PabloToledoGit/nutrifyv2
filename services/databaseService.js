// services/databaseService.js
import { db } from '../firebase.js';

export async function salvarDieta(email, dadosUsuario, receita, valor, tipoReceita, incluiEbook, paymentId) {
  try {
    const dataAtual = new Date();

    const dados = {
      email,
      nome: dadosUsuario.nome || 'Usuário',
      formData: dadosUsuario,
      receitaTexto: receita,
      valor,
      tipoReceita,
      incluiEbook,
      incluiTreino: dadosUsuario.incluiTreino || false,
      incluiDiaLixo: dadosUsuario.incluiDiaLixo || false,
      paymentId,
      criadoEm: dataAtual,
      ano: dataAtual.getFullYear(),
      mes: dataAtual.getMonth() + 1, 
      dia: dataAtual.getDate()
    };

    await db.collection('dietas').add(dados);
    console.log(`[DB] Dieta salva com sucesso para ${email}`);
  } catch (err) {
    console.error('[DB] Erro ao salvar dieta:', err.message);
  }
}
