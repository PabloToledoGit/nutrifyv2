// services/conversaoService.js
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { enviarConversaoMeta } from './metaPixelService.js';

export async function registrarConversao(email, plano, valor) {
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const dataISO = hoje.toISOString();

  try {
    // ✅ Atualiza contagem geral
    const geralRef = db.collection('conversoes').doc('geral');
    await geralRef.set({
      total: admin.firestore.FieldValue.increment(1),
      [`porMes.${anoMes}`]: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // ✅ Atualiza por plano
    const planoRef = db.collection('conversoes').doc('porPlano');
    await planoRef.set({
      [plano]: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // ✅ Atualiza por usuário
    const usuarioRef = db.collection('conversoes').doc(`porUsuario_${email}`);
    await usuarioRef.set({
      total: admin.firestore.FieldValue.increment(1),
      ultimas: admin.firestore.FieldValue.arrayUnion({
        data: dataISO,
        plano,
        valor
      })
    }, { merge: true });

    console.log(`[Conversão] Conversão salva: ${email} | Plano: ${plano} | Valor: R$ ${valor}`);

    // ✅ Envia para a API do Meta
    await enviarConversaoMeta({
      email,
      nome: email.split('@')[0], // ou algum nome real se disponível
      valor,
      plano
    });

  } catch (error) {
    console.error('[Conversão] Erro ao registrar:', error.message);
  }
}
