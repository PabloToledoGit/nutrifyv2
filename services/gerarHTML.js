export const gerarHTMLReceita = (nomeUsuario, textoReceita) => {
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Plano Nutricional - ${nomeUsuario}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Inter', sans-serif;
        color: #1B1B1B;
        background: #f0fdf4;
        padding: 30px;
      }

      .container {
        max-width: 800px;
        margin: auto;
        background: #ffffff;
        border-radius: 16px;
        padding: 40px;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
        border-top: 6px solid #22c55e;
      }

      header {
        text-align: center;
        margin-bottom: 30px;
      }

      header h1 {
        color: #16a34a;
        font-size: 2.2rem;
        font-weight: 700;
      }

      header .sub {
        font-size: 1rem;
        color: #6b7280;
        margin-top: 5px;
      }

      .info {
        display: flex;
        justify-content: space-between;
        margin: 20px 0 30px;
        border-bottom: 1px solid #d1fae5;
        padding-bottom: 10px;
      }

      .info-item {
        font-size: 1rem;
      }

      .info-label {
        font-weight: 600;
        color: #16a34a;
        text-transform: uppercase;
        font-size: 0.75rem;
        margin-bottom: 5px;
      }

      .info-value {
        color: #1B1B1B;
      }

      .receita {
        background: #f0fdf4;
        padding: 20px;
        border: 2px dashed #4ade80;
        border-radius: 10px;
      }

      .receita h1, .receita h2, .receita h3, .receita h4 {
        color: #15803d;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      .receita p,
      .receita li {
        font-size: 1rem;
        color: #1f2937;
        line-height: 1.6;
      }

      .receita ul,
      .receita ol {
        margin: 10px 0 20px 20px;
      }

      .footer {
        text-align: center;
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 40px;
        border-top: 1px solid #d1fae5;
        padding-top: 15px;
      }

      .footer strong {
        color: #16a34a;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }

        .container {
          box-shadow: none;
          border-radius: 0;
          border: none;
        }

        .info, .footer {
          page-break-inside: avoid;
        }

        .receita {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>🥗 Nutrify</h1>
        <div class="sub">Nutrição Inteligente e Personalizada</div>
      </header>

      <div class="info">
        <div class="info-item">
          <div class="info-label">Nome do Usuário</div>
          <div class="info-value">${nomeUsuario}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data</div>
          <div class="info-value">${dataAtual}</div>
        </div>
      </div>

      <div class="receita">
        ${textoReceita.replace(/\n/g, "<br>")}
      </div>

      <div class="footer">
        Este documento foi gerado automaticamente por <strong>Nutrify</strong><br>
      </div>
    </div>
  </body>
  </html>
  `;
};
