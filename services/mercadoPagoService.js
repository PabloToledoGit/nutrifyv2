import { MercadoPagoConfig, Payment, MerchantOrder } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACESS_TOKEN,
  options: { timeout: 5000 }
});

const payment = new Payment(client);
const merchantOrder = new MerchantOrder(client);

export async function criarPagamento({
  email,
  nome,
  sobrenome = '',
  formData,
  valor,
  tipoReceita,
  incluiEbook = false
}) {
  if (!email || !nome || !formData || !valor || !tipoReceita) {
    console.warn('[Pagamento] Dados insuficientes recebidos:', {
      email, nome, sobrenome, valor, tipoReceita, formData
    });
    throw new Error('Dados insuficientes para criar pagamento');
  }

  const valoresPermitidos = [
    10.00, 13.90, 14.90, 15.90, 18.90, 20.80, 19.80,
    17.80, 16.80, 12.90, 11.90, 28.60, 23.70
  ];

  const valorConvertido = Number(valor);
  const valorValido = valoresPermitidos.some(v => v === parseFloat(valorConvertido.toFixed(2)));

  if (!valorValido) {
    console.warn(`[Segurança] Valor inválido recebido: R$ ${valorConvertido}`);
    throw new Error('Valor do plano não autorizado.');
  }

  // ✅ Corrigir flags que vêm do form
  const incluiTreino = formData.incluiTreino === true || formData.incluiTreino === 'true';
  const incluiDiaLixo = formData.incluiDiaLixo === true || formData.incluiDiaLixo === 'true';

  // 🧩 LOG: Metadados recebidos antes de envio
  console.log('[Pagamento] Dados recebidos para criar pagamento:', {
    email,
    nome,
    sobrenome,
    valor: valorConvertido,
    tipoReceita,
    incluiEbook,
    incluiTreino,
    incluiDiaLixo,
    formData
  });

  const metadata = {
    email,
    valor,
    tipoReceita,
    incluiEbook,
    incluiTreino,
    incluiDiaLixo,
    formData: Buffer.from(JSON.stringify(formData)).toString('base64')
  };

  const items = [
    {
      id: 'nutrify001',
      title: `Plano Nutrify Personalizado`,
      description: `Plano alimentar e de treino individualizado`,
      category_id: 'services',
      quantity: 1,
      unit_price: valorConvertido
    }
  ];

  const body = {
    transaction_amount: valorConvertido,
    payment_method_id: 'pix',
    description: `Plano personalizado - Nutrify`,
    payer: {
      email,
      first_name: nome,
      last_name: sobrenome
    },
    metadata,
    additional_info: {
      items,
      payer: {
        first_name: nome,
        last_name: sobrenome
      }
    }
  };

  // 🧩 LOG: Corpo final enviado ao Mercado Pago
  console.log('[Pagamento] Corpo enviado para MP:', body);

  try {
    const response = await payment.create({ body });
    const { id, point_of_interaction } = response;

    if (
      !point_of_interaction?.transaction_data?.qr_code ||
      !point_of_interaction?.transaction_data?.qr_code_base64
    ) {
      console.error('[Pagamento] Dados de QR Code ausentes na resposta:', response);
      throw new Error('Falha ao obter QR Code do pagamento');
    }

    // ✅ LOG: Pagamento criado com sucesso
    console.log('[Pagamento] Pagamento criado com sucesso:', {
      paymentId: id,
      ticketUrl: point_of_interaction.transaction_data.ticket_url
    });

    return {
      paymentId: id,
      qrCode: point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: point_of_interaction.transaction_data.qr_code_base64,
      ticketUrl: point_of_interaction.transaction_data.ticket_url
    };
  } catch (error) {
    console.error('[Pagamento] Erro ao criar pagamento no Mercado Pago:', error);
    throw new Error(error.message || 'Erro ao criar pagamento no Mercado Pago');
  }
}

export async function buscarPagamento(paymentId) {
  try {
    const result = await payment.get({ id: paymentId });
    return result;
  } catch (err) {
    console.error(`[MP] Erro ao buscar pagamento direto por ID ${paymentId}:`, err.message);
    return null;
  }
}

export async function buscarViaMerchantOrder(paymentId) {
  try {
    const result = await merchantOrder.search({ qs: { external_reference: paymentId } });
    return result?.results?.[0]?.payments?.[0] || null;
  } catch (err) {
    console.error(`[MP] Erro ao buscar pagamento via Merchant Order para ID ${paymentId}:`, err.message);
    return null;
  }
}
