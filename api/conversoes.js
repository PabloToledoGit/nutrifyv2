import { db } from '../firebase.js';
import { setCors } from '../utils/cors.js';

export default async function handler(req, res) {
  if (setCors(req, res)) return;

  try {
    const geralSnap = await db.collection('conversoes').doc('geral').get();
    const porPlanoSnap = await db.collection('conversoes').doc('porPlano').get();

    const geral = geralSnap.exists ? geralSnap.data() : {};
    const porPlano = porPlanoSnap.exists ? porPlanoSnap.data() : {};

    const snapshot = await db.collection('conversoes').get();

    const ultimas = [];
    snapshot.forEach(doc => {
      if (doc.id.startsWith('porUsuario_')) {
        const data = doc.data();
        if (Array.isArray(data.ultimas)) {
          data.ultimas.forEach(item => {
            ultimas.push({ ...item, usuario: doc.id.replace('porUsuario_', '') });
          });
        }
      }
    });

    ultimas.sort((a, b) => new Date(b.data) - new Date(a.data));

    res.status(200).json({
      geral,
      porPlano,
      ultimas, // Envia tudo
    });

  } catch (err) {
    console.error('[Admin] Erro ao buscar dados:', err);
    res.status(500).json({ error: 'Erro ao buscar dados das conversões.' });
  }
}
