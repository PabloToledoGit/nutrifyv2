// pages/api/criar-pagamento.js
import { criarPagamento } from '../services/mercadoPagoService.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const {
      email,
      nome,
      valor,
      tipoReceita,
      incluiEbook = false,
      incluiDiaLixo = false,
      formData
    } = req.body;

    // 🔧 Insere as flags dentro do formData
    if (typeof formData === 'object') {
      formData.incluiDiaLixo = incluiDiaLixo;
      formData.incluiTreino = tipoReceita === 'dieta+treino';
    }

    const pagamento = await criarPagamento({
      email,
      nome,
      valor,
      tipoReceita,
      incluiEbook,
      incluiDiaLixo,
      formData
    });

    res.status(200).json(pagamento);
  } catch (err) {
    console.error('[API] Erro ao criar pagamento:', err.message);
    res.status(500).json({ error: 'Erro ao criar pagamento.' });
  }
}
