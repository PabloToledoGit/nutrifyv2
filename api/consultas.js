import { db } from '../firebase.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const snapshot = await db.collection('consultas')
      .orderBy('data_criacao', 'desc')
      .get();

    const consultas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ consultas });
  } catch (err) {
    console.error('[Admin] Erro ao buscar consultas:', err);
    res.status(500).json({ error: 'Erro ao buscar consultas' });
  }
}
