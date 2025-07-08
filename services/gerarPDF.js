import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import path from 'path';

export const gerarPDF = async (titulo, htmlContentCompleto) => {
  let browser = null;
  console.log("🔧 Iniciando a geração do PDF...");

  try {
    const chromium = await import('@sparticuz/chromium');
    const executablePath = await chromium.default.executablePath();

    browser = await puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: executablePath,
      headless: chromium.default.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.setContent(htmlContentCompleto, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
    });

    console.log("✅ Buffer do PDF gerado com sucesso.");
    return pdfBuffer;

  } catch (error) {
    console.error('❌ Erro detalhado ao gerar PDF:', error);
    throw new Error(`Erro na geração do PDF: ${error.message}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
