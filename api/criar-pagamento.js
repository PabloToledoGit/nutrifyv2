// api/pagamento.js
import { criarPagamento } from '../services/mercadoPagoService.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const {
    email,
    nome,
    sobrenome = '',
    formData,
    valor,
    tipoReceita,
    incluiEbook = false,
    incluiDiaLixo = false
  } = req.body;

  console.log('[API] Dados recebidos:', {
    email,
    nome,
    valor,
    tipoReceita,
    incluiEbook,
    incluiDiaLixo,
    formData
  });

  if (!email || !nome || !formData || !valor || !tipoReceita) {
    return res.status(400).json({ error: 'Dados insuficientes para criar pagamento.' });
  }

  try {
    const resultado = await criarPagamento({
      email,
      nome,
      sobrenome,
      formData,
      valor,
      tipoReceita,
      incluiEbook,
      incluiDiaLixo
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[API] Erro ao criar pagamento:', error);
    return res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
}
