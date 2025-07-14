// services/emailService.js
import nodemailer from 'nodemailer';

export const enviarEmailComPDF = async (emailDestinatario, tituloReceita, pdfBuffer, linkEbook = null) => {
  if (!emailDestinatario || !pdfBuffer) {
    throw new Error("Email e buffer do PDF são obrigatórios.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestinatario)) {
    throw new Error("Endereço de e-mail do destinatário inválido.");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      logger: true,
      debug: true
    });

    await transporter.verify();

    const mailOptions = {
      from: 'Nutrify <nutrify@nutrifyservice.com>',
      to: emailDestinatario,
      subject: `📄 Nutrify | Seu Plano Nutricional: ${tituloReceita}`,
      html: `
      <div style="font-family: Inter, sans-serif; line-height: 1.6; color: #1B1B1B; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #22c55e; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Nutrify</h1>
          <p style="color: white; margin: 5px 0 0; font-size: 16px;">Seu plano de nutrição inteligente e personalizado</p>
        </div>

        <div style="padding: 24px; background-color: #f0fdf4; border-radius: 0 0 12px 12px;">
          <p>Olá!</p>

          <p>Seu plano nutricional completo está pronto e foi gerado com base nas informações fornecidas sobre seus objetivos, rotina e preferências.</p>

          <p style="background-color: #dcfce7; padding: 15px; border-left: 4px solid #22c55e; font-size: 14px;">
            <strong>🍀 Dica Nutrify:</strong> Mantenha consistência e atenção às quantidades. O sucesso vem da rotina bem planejada.
          </p>

          <p>Este plano considera:</p>
          <ul>
            <li>Altura, peso, idade e IMC</li>
            <li>Objetivos pessoais e restrições alimentares</li>
            <li>Frequência e tipo de treino</li>
            <li>Necessidades calóricas e metabólicas</li>
          </ul>

          <p style="margin-top: 20px;">Baixe o documento em anexo para conferir todos os detalhes do seu plano.</p>

          ${linkEbook ? `
            <div style="margin-top: 20px; background-color: #fefce8; padding: 16px; border-left: 4px solid #facc15; border-radius: 8px;">
              <p style="margin: 0;">
                📘 <strong>Bônus Especial:</strong> Você também recebeu nosso eBook exclusivo <em>"7 Dietas Fáceis para Perder Peso"</em>.<br>
                <a href="${linkEbook}" target="_blank" style="color: #15803d; font-weight: bold;">Clique aqui para baixar o eBook</a>
              </p>
            </div>
          ` : ''}

          <p style="margin-top: 20px;">Forte abraço,</p>
          <p style="font-weight: bold; color: #16a34a;">Equipe Nutrify</p>
          <p style="font-size: 12px; color: #6b7280;">Nutrição Inteligente com Tecnologia</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1fae5; font-size: 12px; color: #6b7280;">
            <p>Este é um e-mail automático. Para dúvidas sobre seu plano, responda este e-mail ou fale com nosso suporte pelo WhatsApp.</p>
            <p>© ${new Date().getFullYear()} Nutrify - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    `,
      attachments: [
        {
          filename: `Plano_Nutricional_${tituloReceita.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado com sucesso para ${emailDestinatario}. ID: ${info.messageId}`);

    return true;

  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${emailDestinatario}:`, error);

    let errorMessage = 'Erro ao enviar o e-mail com o plano nutricional.';
    if (error.code === 'EAUTH') {
      errorMessage = 'Falha na autenticação SMTP. Verifique as credenciais.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Não foi possível conectar ao servidor SMTP. Verifique a conexão.';
    }

    throw new Error(`${errorMessage} Detalhes: ${error.message}`);
  }
};
