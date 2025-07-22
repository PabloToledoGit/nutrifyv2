// services/databaseService.js
import { db, bucket } from '../firebase.js';

export async function salvarDieta(email, dadosUsuario, receitaTexto, receitaBuffer, valor, tipoReceita, incluiEbook, paymentId) {
  try {
    const dataAtual = new Date();
    const timestamp = Date.now();
    const nomeArquivo = `receita_${timestamp}.pdf`;
    const caminhoArquivo = `receitas/${email}/${nomeArquivo}`;
    const file = bucket.file(caminhoArquivo);

    // Upload do PDF no Storage
    await file.save(receitaBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // Torna o PDF público
    await file.makePublic();
    const arquivoURL = `https://storage.googleapis.com/${bucket.name}/${caminhoArquivo}`;

    // Dados que vão pro Firestore
    const dados = {
      email,
      nome: dadosUsuario.nome || 'Usuário',
      formData: dadosUsuario,
      receitaTexto, // HTML/texto da receita mantido
      valor,
      tipoReceita,
      incluiEbook,
      incluiTreino: dadosUsuario.incluiTreino || false,
      incluiDiaLixo: dadosUsuario.incluiDiaLixo || false,
      paymentId,
      criadoEm: dataAtual,
      ano: dataAtual.getFullYear(),
      mes: dataAtual.getMonth() + 1,
      dia: dataAtual.getDate(),
      arquivoURL // URL do PDF salvo
    };

    // Salvar no Firestore
    await db.collection('dietas').add(dados);
    console.log(`[DB] Dieta salva com texto e PDF para ${email}`);
    return arquivoURL;
  } catch (err) {
    console.error('[DB] Erro ao salvar dieta:', err.message);
    throw err;
  }
}
