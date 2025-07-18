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
    calorias,
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

  // Cálculo do IMC
  const alturaEmMetros = altura / 100;
  const imc = peso / (alturaEmMetros * alturaEmMetros);

  // Classificação do IMC
  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Baixo";
  else if (imc < 25) categoriaIMC = "Eutrófico";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else if (imc < 35) categoriaIMC = "Obesidade I";
  else if (imc < 40) categoriaIMC = "Obesidade II";
  else categoriaIMC = "Obesidade III";

  // Proteína por kg conforme IMC + Gênero
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

  // 💡 Novo cálculo de ajuste calórico com base no plano e IMC
  let ajusteCalorias = 0;

  if (planoNome.toLowerCase().includes("emagrecer power")) {
    ajusteCalorias = -Math.round(Math.random() * 100 + 600); // entre -600 e -700
  } else if (planoNome.toLowerCase().includes("emagrecer") || categoriaIMC === "Sobrepeso" || categoriaIMC.includes("Obesidade")) {
    ajusteCalorias = -500; // emagrecimento padrão
  } else if (planoNome.toLowerCase().includes("hipertrofia")) {
    if (categoriaIMC === "Baixo" || categoriaIMC === "Eutrófico") {
      ajusteCalorias = 300;
    } else {
      ajusteCalorias = -500; // se tiver sobrepeso, prioridade é emagrecer
    }
  } else {
    ajusteCalorias = 0; // plano padrão
  }

  const caloriasAjustadas = Math.round(calorias + ajusteCalorias);


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
- Calorias diárias estimadas (ajustadas): ${caloriasAjustadas}


Preferências Alimentares:
- Café da Manhã: ${alimentosSelecionadosCafe}
- Almoço: ${alimentosSelecionadosAlmoco}
- Lanche: ${alimentosSelecionadosLanche}
- Jantar: ${alimentosSelecionadosJanta}

📌 **Regras para o Plano:**
- Inclua um aviso de exclusividade e privacidade no topo
- Calcule e explique o **IMC** e a **ingestão ideal de água**
- Calcule os **macronutrientes diários** com base nas calorias e peso corporal:
  - **Proteína:** ${proteinaPorKg.toFixed(1)}g por kg de peso corporal (ex: ${peso}kg × ${proteinaPorKg} = ${proteinaTotalG}g proteína = ${proteinaKcal} kcal)
  - **Gordura:** 1.0g por kg de peso corporal (ex: ${peso}g = ${peso * 9} kcal)
  - **Carboidrato:** Use o restante das calorias totais após calcular proteína e gordura
  - Use a conversão padrão:
    - Proteína e Carboidrato = 4 kcal/g
    - Gordura = 9 kcal/g
- Mostre a distribuição total dos macros com gramas e calorias, em um bloco explicativo

- Divida as **refeições** com:
  - Título com horário e calorias estimadas da refeição
  - Para cada refeição, siga a proporção calórica do total diário:
    - Café da Manhã: 20%
    - Lanche da Manhã: 15%
    - Almoço: 25%
    - Lanche da Tarde: 15%
    - Jantar: 25%
  - Apresente **exatamente 3 opções diferentes**, rotuladas como:
    - Opção 1:
    - Opção 2:
    - Opção 3:
  - Cada opção deve conter:
    - Uma refeição completa individual com porções em gramas ou unidades
    - Calorias **aproximadamente iguais** entre as opções (máximo de 10% de variação)
    - Macros equilibrados com base no cálculo diário
  - Nunca induzir o cliente a consumir mais de uma opção por refeição

- Inclua **substituições inteligentes** para proteínas, carboidratos e gorduras, respeitando o histórico de saúde
- **Sugira hábitos saudáveis e suplementos** com base no objetivo (respeitando o histórico de saúde)

${lixoAtivo ? `
🍕 **Inclua uma seção completa chamada "Dia do Lixo":**
- Título: “Dia do Lixo”
- Parágrafo explicando detalhadamente o conceito de refeição livre
- Sugira alimentos que podem ser incluídos como exemplo
- Indique o **melhor momento da semana para aplicar**, considerando o objetivo
- Finalize com um reforço motivacional
` : ''}

${treinoAtivo ? `
🏋️ **Inclua uma seção completa chamada "Plano de Treino Personalizado":**
- Título: "Plano de Treino Semanal"
- Divida a semana com foco muscular
- Liste de 4 a 6 exercícios por dia com:
  - Nome
  - Séries
  - Repetições
  - Descanso
  - Dicas técnicas
- Inclua variações para treino em casa e sem equipamentos
` : ''}

💡 Estrutura HTML:
- Use <h1>, <h2>, <h3> para os títulos
- <p> para explicações e dados
- <ul><li> para listas de alimentos ou exercícios
- Não use <table>
- Inclua classes CSS inline com estilo leve
- O conteúdo deve estar dentro de: <div class='receita'> ... </div>

⚠️ Importante:
- **Não inclua** <html>, <head>, <body>, nem markdown
- **Não use comentários**
- O conteúdo gerado deve ser colado diretamente na função gerarHTMLReceita()

Visual clean, leve, bonito e organizado — com cara de eBook, mas sem excesso de firula.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let resposta = completion.choices?.[0]?.message?.content || "";

    // 🚫 Remove blocos ```html e ```
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
