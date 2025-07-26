import { gerarTextoReceita } from './aiService.js';
import { enviarEmailComPDF } from './emailService.js';
import { buscarPagamento, buscarViaMerchantOrder } from './mercadoPagoService.js';
import { gerarPDF } from './gerarPDF.js';
import { gerarHTMLReceita } from './gerarHTML.js';
import { salvarDieta } from './databaseService.js';
import { registrarConversao } from './conversaoService.js';
import { db } from '../firebase.js';
import admin from 'firebase-admin';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const arredondar = (num) => Math.round(Number(num) * 100) / 100;

export async function processarWebhookPagamento(paymentData) {
  try {
    const webhookStartTime = new Date();
    const { id: notificationId, type, data } = paymentData;

    console.log(`\n[${webhookStartTime.toISOString()}] >>> INÍCIO do Webhook - Tipo: ${type}, Notificação ID: ${notificationId}`);

    if (type !== 'payment') {
      console.log(`[Webhook] Tipo não tratado: ${type}`);
      return;
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('[Webhook] ID do pagamento ausente.');
      return;
    }

    const paymentRef = db.collection("pagamentos_processados").doc(String(paymentId));

    // 🛡️ Proteção contra duplicação usando transação
    const sucesso = await db.runTransaction(async (t) => {
      const snap = await t.get(paymentRef);

      if (snap.exists) {
        console.warn(`[Webhook] Pagamento ${paymentId} já foi processado anteriormente. Encerrando.`);
        return false;
      }

      t.set(paymentRef, {
        processingStartedAt: admin.firestore.Timestamp.now()
      });

      return true;
    });

    if (!sucesso) return;

    // 🔄 Tentativa de buscar pagamento com retry
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

    const isTestMode = process.env.TEST_MODE === 'true';

    if (!isTestMode && (status || '').toLowerCase() !== 'approved') {
      console.log(`[Webhook] Pagamento ${id} com status "${status}". Ignorado.`);
      return;
    }

    if (isTestMode) {
      console.log(`[Webhook] TEST_MODE ativo. Simulando aprovação para pagamento com status "${status}"`);
    }

    console.log('[Webhook] Metadata bruta recebida:', metadata);

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

    if (!formDataEncoded || !email) {
      console.error('[Webhook] Campos obrigatórios ausentes: formData ou email.');
      return;
    }

    let dadosUsuario = {};
    try {
      dadosUsuario = JSON.parse(Buffer.from(formDataEncoded, 'base64').toString('utf8'));
      dadosUsuario.incluiTreino = dadosUsuario.incluiTreino === true || dadosUsuario.incluiTreino === 'true';
      dadosUsuario.incluiDiaLixo = dadosUsuario.incluiDiaLixo === true || dadosUsuario.incluiDiaLixo === 'true';

      console.log('[Webhook] Dados do usuário extraídos:', {
        nome: dadosUsuario.nome,
        incluiTreino: dadosUsuario.incluiTreino,
        incluiDiaLixo: dadosUsuario.incluiDiaLixo
      });
    } catch (err) {
      console.error('[Webhook] Erro ao decodificar formData:', err);
      return;
    }

    console.log('[Webhook] Chamando IA para gerar a receita...');
    const receita = await gerarTextoReceita(dadosUsuario);
    console.log('[Webhook] Receita gerada com sucesso.');

    console.log('🔧 Iniciando a geração do PDF...');
    const html = gerarHTMLReceita(dadosUsuario.nome || 'Usuário', receita);
    const pdfBuffer = await gerarPDF(dadosUsuario.nome || 'usuario', html);
    console.log('✅ Buffer do PDF gerado com sucesso.');

    const incluiEbookRaw = metadata.incluiEbook || metadata.inclui_ebook;
    const incluiEbook = incluiEbookRaw === true || incluiEbookRaw === 'true';

    const linkEbook = incluiEbook
      ? 'https://firebasestorage.googleapis.com/v0/b/nutrify-2ca2d.firebasestorage.app/o/7%20Dietas%20F%C3%A1ceis%20e%20Pr%C3%A1ticas%20para%20Perder%20at%C3%A9%2020%25%20de%20Peso%20em%201%20M%C3%AAs.pdf?alt=media&token=675a4ebd-2b9b-439f-9053-f6f9a6a2d904'
      : null;

    console.log('[Webhook] Link do eBook:', linkEbook || 'Não incluso');

    console.log(`[Webhook] Enviando e-mail para ${email}...`);
    await enviarEmailComPDF(email, dadosUsuario.nome || 'Seu Plano', pdfBuffer, linkEbook);
    console.log(`[Webhook] ✅ E-mail enviado com sucesso.`);

    const planoNome = metadata.plano || 'Indefinido';

    console.log('[Webhook] Registrando conversão...');
    await registrarConversao(email, planoNome, valorPago);

    console.log('[Webhook] Salvando dieta...');
    await salvarDieta(email, dadosUsuario, receita, pdfBuffer, valorPago, tipoReceita, incluiEbook, id);

    console.log('[Webhook] Atualizando documento do pagamento como processado.');
    await paymentRef.set({
      processedAt: admin.firestore.Timestamp.now(),
      email,
      valor: valorPago,
      plano: planoNome
    });

    const webhookEndTime = new Date();
    const duration = ((webhookEndTime - webhookStartTime) / 1000).toFixed(2);

    console.log(`[Webhook] ✅ PROCESSO FINALIZADO para pagamento ${id} em ${duration}s.\n`);
  } catch (err) {
    console.error('[Webhook] ❌ Erro fatal no processamento:', err);
    throw err;
  }
}
