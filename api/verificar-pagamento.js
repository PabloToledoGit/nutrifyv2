// api/verificar-pagamento.js
import { buscarPagamento } from '../services/mercadoPagoService.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ message: 'paymentId não fornecido' });
  }

  try {
    const pagamento = await buscarPagamento(paymentId);

    if (!pagamento) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }

    return res.status(200).json({
      status: pagamento.status, // "approved", "pending", etc
      detalhe: pagamento.status_detail,
      valor: pagamento.transaction_amount,
      email: pagamento.payer?.email,
      nome: pagamento.payer?.first_name
    });
  } catch (err) {
    console.error('[Erro] ao verificar pagamento:', err);
    return res.status(500).json({ message: 'Erro interno ao verificar pagamento.' });
  }
}
