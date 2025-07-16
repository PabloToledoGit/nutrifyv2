import nodemailer from 'nodemailer';

export const enviarEmailComPDF = async (emailDestinatario, tituloReceita, pdfBuffer, linkEbook = null) => {
  if (!emailDestinatario || !pdfBuffer) {
    throw new Error("Email e buffer do PDF são obrigatórios.");
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestinatario);
  if (!emailValido) {
    throw new Error("Endereço de e-mail do destinatário inválido.");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: 'nutrify@nutrifyservice.com',
        pass: 'Pa199735@' // ⚠️ Substituir depois em produção
      },
      tls: { rejectUnauthorized: false },
      logger: true,
      debug: true
    });

    await transporter.verify();

    const assunto = `📄 Nutrify | Seu Plano Nutricional: ${tituloReceita}`;
    const nomePDF = `Plano_Nutricional_${tituloReceita.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.pdf`;

    const corpoHTML = `
      <div style="font-family: Inter, sans-serif; line-height: 1.6; color: #1B1B1B; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Nutrify</h1>
          <p style="color: white; margin: 5px 0 0; font-size: 16px;">Seu plano de nutrição inteligente e personalizado</p>
        </div>

        <div style="padding: 24px; background-color: #f0fdf4; border-radius: 0 0 12px 12px;">
          <p>Olá!</p>
          <p>Seu plano nutricional completo está pronto! Ele foi gerado com base nas suas informações e objetivos.</p>

          <p style="background-color: #dcfce7; padding: 15px; border-left: 4px solid #22c55e; font-size: 14px;">
            <strong>🍀 Dica Nutrify:</strong> Siga com consistência e foco! Os melhores resultados vêm da rotina.
          </p>

          <ul>
            <li>✓ Altura, peso, idade e IMC</li>
            <li>✓ Objetivos e restrições alimentares</li>
            <li>✓ Frequência de treino</li>
            <li>✓ Necessidades calóricas e metabólicas</li>
          </ul>

          <p style="margin-top: 20px;">O seu plano está em anexo neste e-mail. 💚</p>

          ${linkEbook ? `
            <div style="margin-top: 30px; background-color: #fefce8; padding: 16px; border-left: 4px solid #facc15; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0;">🎁 Bônus Especial</h3>
              <p style="margin: 0 0 10px 0;">Você também recebeu nosso eBook exclusivo:</p>
              <p style="font-weight: bold; font-style: italic;">"7 Dietas Fáceis para Perder Peso"</p>
              <a href="${linkEbook}" target="_blank" style="display: inline-block; margin-top: 12px; background-color: #16a34a; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                📘 Baixar eBook agora
              </a>
            </div>
          ` : ''}

          <p style="margin-top: 30px;">Forte abraço,</p>
          <p style="font-weight: bold; color: #16a34a;">Equipe Nutrify</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1fae5; font-size: 12px; color: #6b7280;">
            <p>Este é um e-mail automático. Para dúvidas, responda este e-mail ou fale com nosso suporte pelo WhatsApp.</p>
            <p>© ${new Date().getFullYear()} Nutrify - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: 'Nutrify <nutrify@nutrifyservice.com>',
      to: emailDestinatario,
      subject: assunto,
      html: corpoHTML,
      attachments: [
        {
          filename: nomePDF,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado com sucesso para ${emailDestinatario}. ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error(`❌ Erro ao enviar e-mail para ${emailDestinatario}:`, error);

    let msg = 'Erro ao enviar o e-mail com o plano nutricional.';
    if (error.code === 'EAUTH') msg = 'Falha na autenticação SMTP.';
    if (error.code === 'ECONNECTION') msg = 'Erro de conexão com o servidor SMTP.';

    throw new Error(`${msg} Detalhes: ${error.message}`);
  }
};
