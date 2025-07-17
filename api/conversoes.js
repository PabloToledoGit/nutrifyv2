// pages/api/admin/conversoes.js
import { db } from '../firebase'; // ajuste conforme seu path

export default async function handler(req, res) {
  try {
    const geralSnap = await db.collection('conversoes').doc('geral').get();
    const porPlanoSnap = await db.collection('conversoes').doc('porPlano').get();

    const geral = geralSnap.exists ? geralSnap.data() : {};
    const porPlano = porPlanoSnap.exists ? porPlanoSnap.data() : {};

    // Busca documentos com prefixo porUsuario_
    const allDocs = await db.collection('conversoes').listDocuments();
    const userDocs = allDocs.filter(doc => doc.id.startsWith('porUsuario_'));

    const ultimas = [];

    for (const docRef of userDocs) {
      const doc = await docRef.get();
      const data = doc.data();

      if (data.ultimas && Array.isArray(data.ultimas)) {
        data.ultimas.forEach(item =>
          ultimas.push({ ...item, usuario: doc.id.replace('porUsuario_', '') })
        );
      }
    }

    // Ordena por data decrescente
    ultimas.sort((a, b) => new Date(b.data) - new Date(a.data));

    res.status(200).json({
      geral,
      porPlano,
      ultimas: ultimas.slice(0, 10),
    });
  } catch (err) {
    console.error('[Admin] Erro ao buscar dados:', err);
    res.status(500).json({ error: 'Erro ao buscar dados das conversões.' });
  }
}
