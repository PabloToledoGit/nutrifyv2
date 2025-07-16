// services/webhookService.js
import { gerarTextoReceita } from './aiService.js';
import { enviarEmailComPDF } from './emailService.js';
import { buscarPagamento, buscarViaMerchantOrder } from './mercadoPagoService.js';
import { gerarPDF } from './gerarPDF.js';
import { gerarHTMLReceita } from './gerarHTML.js';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const arredondar = (num) => Math.round(Number(num) * 100) / 100;

export async function processarWebhookPagamento(paymentData) {
  try {
    const { id: notificationId, type, data } = paymentData;
    console.log(`[Webhook] Notificação recebida. Tipo: ${type}, ID: ${notificationId}`);

    if (type !== 'payment') {
      console.log(`[Webhook] Tipo não tratado: ${type}`);
      return;
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('[Webhook] ID do pagamento ausente.');
      return;
    }

    let pagamento = null;
    const tentativas = 5;
    for (let i = 0; i < tentativas; i++) {
      try {
        pagamento = await buscarPagamento(paymentId);
        if (pagamento) break;
      } catch (error) {
        console.warn(`[Tentativa ${i + 1}] Erro ao buscar pagamento: ${error.message}`);
        await delay(2000 * (i + 1));
      }
    }

    if (!pagamento) {
      console.warn('[Webhook] Buscando via Merchant Order...');
      pagamento = await buscarViaMerchantOrder(paymentId);
    }

    if (!pagamento) {
      console.error(`[Webhook] Pagamento ${paymentId} não encontrado.`);
      return;
    }

    const { id, status, metadata = {}, transaction_amount, payer = {}, additional_info = {} } = pagamento;

    if ((status || '').toLowerCase() !== 'approved') {
      console.log(`[Webhook] Pagamento ${id} com status "${status}". Ignorado.`);
      return;
    }

    const tipoReceita = metadata.tipoReceita || metadata.tipo_receita;
    const formDataEncoded = metadata.formData || metadata.form_data;
    const email = metadata.email || payer.email;

    const itens = additional_info?.items || [];
    const valorPago = arredondar(transaction_amount);
    const somaDosItens = arredondar(itens.reduce((acc, item) => acc + Number(item.unit_price || 0), 0));

    if (valorPago !== somaDosItens) {
      console.error(`[Webhook] Valor pago (${valorPago}) difere da soma dos itens (${somaDosItens})`);
      return;
    }

    console.log(`[Webhook] Pagamento validado. Valor: R$ ${valorPago} | Receita: ${tipoReceita}`);

    const camposFaltando = [];
    if (!formDataEncoded) camposFaltando.push('formData');
    if (!email) camposFaltando.push('email');

    if (camposFaltando.length) {
      console.error(`[Webhook] Campos faltando: ${camposFaltando.join(', ')}`);
      return;
    }

    let dadosUsuario = {};
    try {
      dadosUsuario = JSON.parse(Buffer.from(formDataEncoded, 'base64').toString('utf8'));

      // 🚨 Adiciona flags extras vindas do metadata
      dadosUsuario.incluiTreino = dadosUsuario.incluiTreino === true || dadosUsuario.incluiTreino === 'true';
      dadosUsuario.incluiDiaLixo = dadosUsuario.incluiDiaLixo === true || dadosUsuario.incluiDiaLixo === 'true';


      console.log("[Webhook] Flags adicionadas ao formData:", {
        incluiTreino: dadosUsuario.incluiTreino,
        incluiDiaLixo: dadosUsuario.incluiDiaLixo
      });

    } catch (err) {
      console.error('[Webhook] Erro ao decodificar formData:', err);
      return;
    }

    const receita = await gerarTextoReceita(dadosUsuario);
    console.log('[Webhook] Receita gerada.');

    const html = gerarHTMLReceita(dadosUsuario.nome || 'Usuário', receita);
    const pdfBuffer = await gerarPDF(dadosUsuario.nome || 'usuario', html);

    const incluiEbook = metadata.incluiEbook === true || metadata.incluiEbook === 'true';
    const linkEbook = incluiEbook
      ? 'https://firebasestorage.googleapis.com/v0/b/nutrify-2ca2d.firebasestorage.app/o/7%20Dietas%20F%C3%A1ceis%20e%20Pr%C3%A1ticas%20para%20Perder%20at%C3%A9%2020%25%20de%20Peso%20em%201%20M%C3%AAs.pdf?alt=media&token=675a4ebd-2b9b-439f-9053-f6f9a6a2d904'
      : null;

    await enviarEmailComPDF(email, dadosUsuario.nome || 'Seu Plano', pdfBuffer, linkEbook);

    console.log(`[Webhook] E-mail com PDF enviado para ${email}`);

    console.log(`[Webhook] Processo finalizado com sucesso para pagamento ${id}`);
  } catch (err) {
    console.error('[Webhook] Erro fatal no processamento do webhook:', err);
    throw err;
  }
}
