// services/recipeService.js
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
    objetivo,
    calorias,
    alimentosSelecionadosCafe,
    alimentosSelecionadosAlmoco,
    alimentosSelecionadosLanche,
    alimentosSelecionadosJanta,
    frequenciaTreino,
    planoNome,
    historicoSaude = "",
    incluiTreino = false,
    incluiDiaLixo = false
  } = userData;

  // 🔒 Corrigir possíveis tipos incorretos de boolean vindo como string
  const treinoAtivo = String(incluiTreino).toLowerCase() === 'true' || incluiTreino === true;
  const lixoAtivo = String(incluiDiaLixo).toLowerCase() === 'true' || incluiDiaLixo === true;

  const prompt = `
**Atenção: Priorize o histórico de saúde do cliente em todas as decisões da dieta e treino. Nenhum alimento, suplemento ou atividade deve ser recomendada caso contrarie restrições ou condições descritas.**

Histórico de saúde informado pelo cliente:
${historicoSaude}

Utilize os dados abaixo para gerar um plano nutricional${treinoAtivo ? ' e de treino' : ''} personalizado em **HTML e CSS embutido**, com aparência visual semelhante ao plano "Dieta NutriInteligente" mas adaptado à identidade moderna e limpa do Nutrify (tons de verde, blocos bem definidos, títulos claros e seções bem divididas).

Informações do Usuário:
- Nome do Plano: ${planoNome}
- Peso: ${peso} kg
- Altura: ${altura} cm
- Idade: ${idade} anos
- Gênero: ${genero}
- Objetivo: ${objetivo}
- Calorias diárias: ${calorias}
- Frequência de treino: ${frequenciaTreino}

Preferências Alimentares:
- Café da Manhã: ${alimentosSelecionadosCafe}
- Almoço: ${alimentosSelecionadosAlmoco}
- Lanche: ${alimentosSelecionadosLanche}
- Jantar: ${alimentosSelecionadosJanta}

📌 **Regras para o Plano:**
- Inclua um aviso de exclusividade e privacidade no topo
- Calcule e explique o **IMC** e a **ingestão ideal de água**
- Divida as **refeições** com:
  - Título com horário e calorias da refeição
  - 3 opções de cardápio com quantidades em gramas
  - Total de calorias por refeição proporcional: Café (20%), Lanche Manhã (15%), Almoço (25%), Lanche Tarde (15%), Jantar (25%)
- Inclua **substituições** inteligentes para proteína, carbo e gordura se possível
- **Sugira hábitos saudáveis e suplementos** com base no objetivo (respeitando o histórico de saúde)

📅 ${treinoAtivo ? `**Inclua um plano de treino semanal** com:
- Divisão de treinos de Segunda a Sábado
- Títulos dos dias com foco (ex: “Peito e Tríceps”)
- Lista de exercícios com séries, repetições e observações
` : ''}

${lixoAtivo ? `
🍕 **Inclua uma seção chamada "Dia do Lixo":**
- Título: “Dia do Lixo”
- Parágrafo explicando o conceito de refeição livre semanal
- Dicas práticas de como aproveitar sem sabotar os resultados
- Sugira o melhor momento da semana para aplicar a refeição livre com base no objetivo
` : ''}

💡 Estrutura HTML:
- Use <h1>, <h2>, <h3> para os títulos
- <p> para explicações e dados
- <ul><li> para listas de alimentos ou exercícios
- Não use <table>
- Inclua classes CSS inline com estilo leve (como se fosse um layout bonito, mas que será renderizado direto no navegador ou convertido em PDF)
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

    // 🚫 Remover blocos ```html e ```
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
