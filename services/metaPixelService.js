// services/metaPixelService.js
import fetch from 'node-fetch';
import crypto from 'crypto';

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PIXEL_ID = process.env.META_PIXEL_ID;

function hashSHA256(value) {
  return crypto.createHash('sha256').update(value.toLowerCase()).digest('hex');
}

export async function enviarConversaoMeta({ email, nome, valor, plano }) {
  if (!email || !valor || !plano || !PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[MetaPixel] Dados insuficientes para enviar conversão.');
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: 'https://nutrifyapp.online/pages/obrigado', // ou sua página de obrigado real
        user_data: {
          em: [hashSHA256(email)],
        },
        custom_data: {
          currency: 'BRL',
          value: valor,
          content_name: plano,
          content_category: 'nutricao-personalizada',
        },
      },
    ],
    access_token: ACCESS_TOKEN,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await response.json();

    if (!response.ok || json.error) {
      console.error('[MetaPixel] Erro ao enviar evento:', json.error || json);
    } else {
      console.log('[MetaPixel] Conversão enviada com sucesso ao Meta.');
    }
  } catch (err) {
    console.error('[MetaPixel] Falha de rede ao enviar conversão:', err.message);
  }
}
