import { processarWebhookPagamento } from '../services/webhookService.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    await processarWebhookPagamento(req.body);
    return res.status(200).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
