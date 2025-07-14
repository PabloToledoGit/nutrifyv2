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

Utilize os dados abaixo para gerar um plano nutricional${treinoAtivo ? ' e de treino' : ''} personalizado em formato de **HTML e CSS**, adaptado para o modelo de layout do Nutrify. O conteúdo precisa estar diretamente pronto para ser inserido na função gerarHTMLReceita(), sem usar markdown:

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

Estrutura Esperada:
- Utilize <h1> a <h4> para títulos e subtítulos
- Use <ul> e <li> para listas de alimentos
- Use <p> para textos gerais
- Os títulos principais devem ter cor verde (#15803d) e usar a estrutura do HTML que será injetada dentro da div com classe 'receita'.

Regras:
- Divida as refeições (café, almoço, lanche, jantar) com opções diferentes
- Atribua quantidade de calorias proporcional: Café (20%), Lanche Manhã (15%), Almoço (25%), Lanche Tarde (15%), Jantar (25%)
- Apresente substituições para proteínas, carboidratos e gorduras
- Mostre horários indicados para cada refeição
- Calcule IMC e água ideal com explicação
- Sugira hábitos e suplementos com base no objetivo, respeitando o histórico de saúde

${treinoAtivo ? `Inclua um plano de treino semanal, com dias divididos, exercícios, repetições, tempo de descanso e observações — adaptado ao histórico de saúde do cliente.` : ''}

${lixoAtivo ? `Adicione uma seção chamada "Dia do Lixo" com instruções para uma refeição livre semanal, explicando como aproveitar sem prejudicar os resultados, considerando o histórico de saúde.` : ''}

Importante:
- Não inclua cabeçalho, HTML, HEAD, BODY, nem CSS.
- Apenas o conteúdo dentro da <div class='receita'>...
- Não coloque comentários, apenas HTML válido.
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
