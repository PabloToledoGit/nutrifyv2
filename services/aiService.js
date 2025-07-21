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

  // Tabela de proteína por IMC e gênero
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

  const temProblemaRenal = historicoSaude.toLowerCase().includes("renal");
  let proteinaPorKg = temProblemaRenal
    ? 1.0
    : tabelaProteina[genero]?.[categoriaIMC] || 2.0;

  const proteinaTotalG = Math.round(peso * proteinaPorKg);
  const proteinaKcal = proteinaTotalG * 4;

  // Cálculo da TMB
  const tmb = genero === "Masculino"
    ? 66 + (13.75 * peso) + (5 * altura) - (6.75 * idade)
    : 655 + (9.56 * peso) + (1.85 * altura) - (4.68 * idade);

  // Correção do FA
  let fatorAtividadeOriginal = parseFloat(nivelAtividade);
  let fatorAtividadeCorrigido = fatorAtividadeOriginal;
  const planoEmagrecimento = planoNome?.toLowerCase().includes("emagrecer");
  const sobrepesoOuMais = ["Sobrepeso", "Obesidade I", "Obesidade II", "Obesidade III"].includes(categoriaIMC);

  if (planoEmagrecimento && sobrepesoOuMais) {
    if (fatorAtividadeOriginal <= 1.2) fatorAtividadeCorrigido = 1.0;
    else if (fatorAtividadeOriginal <= 1.375) fatorAtividadeCorrigido = 1.1;
    else if (fatorAtividadeOriginal <= 1.55) fatorAtividadeCorrigido = 1.3;
    else if (fatorAtividadeOriginal <= 1.725) fatorAtividadeCorrigido = 1.4;
    else fatorAtividadeCorrigido = 1.5;
  }

  const calorias = Math.round(tmb * fatorAtividadeCorrigido);

  // Ajuste calórico final
  let ajusteCalorias = 0;
  if (planoNome.toLowerCase().includes("emagrecer power")) {
    ajusteCalorias = -Math.round(Math.random() * 100 + 600); // -600 a -700
  } else if (planoNome.toLowerCase().includes("emagrecer") || categoriaIMC === "Sobrepeso" || categoriaIMC.includes("Obesidade")) {
    ajusteCalorias = -500;
  } else if (planoNome.toLowerCase().includes("hipertrofia")) {
    ajusteCalorias = (categoriaIMC === "Baixo" || categoriaIMC === "Eutrófico") ? 300 : -500;
  }

  const caloriasAjustadas = Math.round(calorias + ajusteCalorias);

  // Cálculo melhorado para gordura
  let gorduraPorKg;

  switch (categoriaIMC) {
    case "Sobrepeso":
      gorduraPorKg = 0.7;
      break;
    case "Obesidade I":
      gorduraPorKg = 0.6;
      break;
    case "Obesidade II":
    case "Obesidade III":
      gorduraPorKg = 0.5;
      break;
    case "Eutrófico":
      if (caloriasAjustadas >= 3000) gorduraPorKg = 1.0;
      else if (caloriasAjustadas >= 2500) gorduraPorKg = 0.9;
      else if (caloriasAjustadas >= 2000) gorduraPorKg = 0.8;
      else gorduraPorKg = 0.7;
      break;
    default:
      gorduraPorKg = 0.8;
      break;
  }

  const gorduraTotalG = Math.round(peso * gorduraPorKg);
  const gorduraKcal = gorduraTotalG * 9;

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
- Nível de Atividade Física: ${nivelAtividade} (original) / ${fatorAtividadeCorrigido} (ajustado)
- Calorias diárias estimadas (ajustadas): ${caloriasAjustadas} kcal

Preferências Alimentares:
- Café da Manhã: ${alimentosSelecionadosCafe}
- Almoço: ${alimentosSelecionadosAlmoco}
- Lanche: ${alimentosSelecionadosLanche}
- Jantar: ${alimentosSelecionadosJanta}

📌 **Regras para o Plano:**
- Inclua um aviso de exclusividade e privacidade no topo
- Inclua um aviso de que é recomendável trocar a dieta dentro de 20 a 30 dias no topo
- Calcule e explique o **IMC** e a **ingestão ideal de água**
- Calcule os **macronutrientes diários** com base nas calorias e peso corporal:

  - **Proteína:** ${proteinaPorKg.toFixed(1)}g/kg (ex: ${peso}kg × ${proteinaPorKg} = ${proteinaTotalG}g proteína = ${proteinaKcal} kcal)
    - Caso o histórico de saúde tenha restrições renais, use 1g/kg

  - **Gordura:** ${gorduraPorKg.toFixed(1)}g/kg (ex: ${peso}kg × ${gorduraPorKg} = ${gorduraTotalG}g gordura = ${gorduraKcal} kcal)
    - Regras utilizadas para gordura:
      - Eutrófico:
        - ≥ 3000 kcal: 1.0g/kg
        - ≥ 2500 kcal: 0.9g/kg
        - ≥ 2000 kcal: 0.8g/kg
        - < 2000 kcal: 0.7g/kg
      - Sobrepeso: 0.7g/kg
      - Obesidade I: 0.6g/kg
      - Obesidade II ou III: 0.5g/kg

  - **Carboidrato:** Use o restante das calorias totais
  - Conversão:
    - Proteína/Carboidrato = 4 kcal/g
    - Gordura = 9 kcal/g

- Mostre a distribuição total dos macros com gramas e calorias, em um bloco explicativo

- Divida as **refeições** com:
  - Título com horário e calorias estimadas
  - Siga a divisão calórica:
    - Café da Manhã: 20%
    - Lanche da Manhã: 15%
    - Almoço: 25%
    - Lanche da Tarde: 15%
    - Jantar: 25%
  - Para cada refeição, apresente 3 opções:
    - Opção 1:
    - Opção 2:
    - Opção 3:
  - Cada uma com:
    - Porções em gramas/unidades
    - Calorias semelhantes (±10%)
    - Macros equilibrados
  - Nunca oriente o cliente a consumir mais de uma opção por refeição

- Inclua substituições inteligentes para proteínas, carboidratos e gorduras
- Sugira hábitos saudáveis e suplementos conforme objetivo (respeitando histórico)

${lixoAtivo ? `
🍕 **Inclua uma seção chamada "Dia do Lixo"**:
- Explique o conceito
- Sugira alimentos
- Recomende o melhor dia da semana
- Finalize com incentivo/motivação
` : ''}

${treinoAtivo ? `
🏋️ **Inclua uma seção chamada "Plano de Treino Personalizado"**:
- Divida a semana com foco muscular
- Para cada dia:
  - Exercícios (4 a 6)
  - Séries, repetições, descanso
  - Dicas técnicas
- Inclua variações para treino em casa
` : ''}

💡 HTML:
- Use <h1>, <h2>, <h3> para títulos
- <p> para explicações
- <ul><li> para listas
- Não usar <table>
- Estilo CSS inline e leve
- Envolver tudo em <div class='receita'> ... </div>

⚠️ Atenção:
- Não inclua <html>, <head> ou <body>
- Não use markdown
- Não insira comentários no código

Visual moderno, leve, com cara de eBook profissional.

🛑 **Aviso Importante:** Esta dieta foi gerada automaticamente pela Nutrify com base nos dados fornecidos pelo usuário. Ela **não substitui uma consulta com um nutricionista qualificado**. Sempre que possível, busque acompanhamento profissional individualizado.
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
