import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const gerarTextoReceita = async (userData) => {
  const {
    peso,
    altura,
    idade,
    genero,
    calorias: caloriasBase,
    alimentosSelecionadosCafe,
    alimentosSelecionadosAlmoco,
    alimentosSelecionadosLanche,
    alimentosSelecionadosJanta,
    nivelAtividade,
    planoNome,
    historicoSaude = "",
    incluiTreino = false,
    incluiDiaLixo = false
  } = userData;

  const treinoAtivo = String(incluiTreino).toLowerCase() === 'true' || incluiTreino === true;
  const lixoAtivo = String(incluiDiaLixo).toLowerCase() === 'true' || incluiDiaLixo === true;

  const alturaEmMetros = altura / 100;
  const imc = peso / (alturaEmMetros * alturaEmMetros);

  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Baixo";
  else if (imc < 25) categoriaIMC = "Eutrófico";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else if (imc < 35) categoriaIMC = "Obesidade I";
  else if (imc < 40) categoriaIMC = "Obesidade II";
  else categoriaIMC = "Obesidade III";

  const tabelaProteina = {
    Masculino: {
      "Baixo": 2.2,
      "Eutrófico": 2.0,
      "Sobrepeso": 1.8,
      "Obesidade I": 1.6,
      "Obesidade II": 1.4,
      "Obesidade III": 1.2,
    },
    Feminino: {
      "Baixo": 2.2,
      "Eutrófico": 1.9,
      "Sobrepeso": 1.6,
      "Obesidade I": 1.4,
      "Obesidade II": 1.2,
      "Obesidade III": 1.0,
    }
  };

  const proteinaPorKg = tabelaProteina[genero]?.[categoriaIMC] || 2.0;
  const proteinaTotalG = Math.round(peso * proteinaPorKg);
  const proteinaKcal = proteinaTotalG * 4;

  // 🔥 Ajuste de calorias com base no plano e IMC
  let calorias = caloriasBase;
  if (planoNome?.toLowerCase().includes("emagrecer power")) {
    calorias = Math.round(caloriasBase - (Math.random() * 100 + 600)); // -600 a -700
  } else if (planoNome?.toLowerCase().includes("emagrecer") || categoriaIMC === "Sobrepeso" || categoriaIMC.includes("Obesidade")) {
    calorias = Math.round(caloriasBase - 500);
  } else if (planoNome?.toLowerCase().includes("massa") || planoNome?.toLowerCase().includes("hipertrofia")) {
    if (categoriaIMC === "Baixo" || categoriaIMC === "Eutrófico") {
      calorias = Math.round(caloriasBase + 300);
    } else {
      calorias = Math.round(caloriasBase - 500);
    }
  }

  // Arredondar para valor mais próximo de 50 (ex: 1932 → 1950)
  calorias = Math.round(calorias / 50) * 50;

  console.log("[Prompt] treinoAtivo:", treinoAtivo);
  console.log("[Prompt] lixoAtivo:", lixoAtivo);

  const prompt = `
**Atenção: Priorize o histórico de saúde do cliente em todas as decisões da dieta e treino. Nenhum alimento, suplemento ou atividade deve ser recomendada caso contrarie restrições ou condições descritas.**

Histórico de saúde informado pelo cliente:
${historicoSaude}

Utilize os dados abaixo para gerar um plano nutricional${treinoAtivo ? ' e de treino' : ''} personalizado em **HTML e CSS embutido**, com aparência visual semelhante ao plano "Dieta NutriInteligente", mas adaptado à identidade moderna e limpa do Nutrify (tons de verde, blocos bem definidos, títulos claros e seções bem divididas).

Informações do Usuário:
- Nome do Plano: ${planoNome}
- Peso: ${peso} kg
- Altura: ${altura} cm
- Idade: ${idade} anos
- Gênero: ${genero}
- IMC: ${imc.toFixed(2)} (${categoriaIMC})
- Nível de Atividade Física: ${nivelAtividade} (multiplicador da fórmula Harris-Benedict)
- Calorias ajustadas para o plano: ${calorias}

Preferências Alimentares:
- Café da Manhã: ${alimentosSelecionadosCafe}
- Almoço: ${alimentosSelecionadosAlmoco}
- Lanche: ${alimentosSelecionadosLanche}
- Jantar: ${alimentosSelecionadosJanta}

📌 **Regras para o Plano:**
- Inclua um aviso de exclusividade e privacidade no topo
- Calcule e explique o **IMC** e a **ingestão ideal de água**
- Calcule os **macronutrientes diários** com base nas calorias e peso corporal:
  - **Proteína:** ${proteinaPorKg.toFixed(1)}g/kg (≈ ${proteinaTotalG}g = ${proteinaKcal} kcal)
  - **Gordura:** 1g/kg (≈ ${peso}g = ${peso * 9} kcal)
  - **Carboidrato:** Calorias restantes após proteína e gordura
  - Conversões:
    - Proteína e Carboidrato: 4 kcal/g
    - Gordura: 9 kcal/g
- Mostre os macros com gramas e calorias

- Divida as refeições com:
  - Horário + calorias estimadas
  - 3 opções por refeição, bem balanceadas (10% de variação no máximo)
  - Nunca oriente consumir mais de uma opção por refeição

- Inclua substituições inteligentes e sugestões de hábitos/suplementos

${lixoAtivo ? `
🍕 **Seção "Dia do Lixo"**:
- Explicação sobre refeição livre
- Sugestões do que pode consumir
- Melhor dia da semana
- Reforço motivacional
` : ''}

${treinoAtivo ? `
🏋️ **Seção de Treino**:
- Treino semanal com 4 a 6 exercícios/dia
- Nome, séries, repetições, descanso
- Variações para treinar em casa
` : ''}

💡 Estrutura HTML:
- Use tags semânticas: <h1>, <p>, <ul>, etc
- Inclua classes CSS inline
- Todo conteúdo dentro de <div class='receita'>...</div>
- Não use <html>, <head>, <body>, nem comentários
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let resposta = completion.choices?.[0]?.message?.content || "";
    resposta = resposta.replace(/```html|```/g, "").trim();

    if (!resposta) {
      console.error("Resposta vazia da OpenAI", completion);
      throw new Error("Erro: Resposta vazia da OpenAI.");
    }

    return resposta;
  } catch (error) {
    console.error("Erro na geração da receita:", error);
    throw new Error(`Erro na geração da receita: ${error.message}`);
  }
};
