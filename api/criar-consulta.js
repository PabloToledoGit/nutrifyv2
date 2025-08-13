// pages/api/criar-consulta.js
import { criarPagamento } from '../services/mercadoPagoService.js';
import { db } from '../../firebase.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, nome, telefone } = req.body;

    if (!email || !nome || !telefone) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const valor = 30.0;

    const formData = {
      planoNome: 'Consulta com Nutricionista',
      telefone
    };

    const pagamento = await criarPagamento({
      email,
      nome,
      valor,
      tipoReceita: 'consulta',
      incluiEbook: false,
      incluiDiaLixo: false,
      formData
    });

    // Registra a intenção de consulta no Firestore (com status inicial)
    await db.collection('consultas').doc(email).set({
      nome,
      email,
      telefone,
      valor,
      status: 'aguardando_pagamento',
      data_criacao: new Date()
    });

    res.status(200).json({
      ...pagamento,
      message: 'Pagamento criado com sucesso.'
    });
  } catch (err) {
    console.error('[Consulta API] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao criar consulta.' });
  }
}
