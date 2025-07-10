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
    incluiTreino = false,
    incluiDiaLixo = false
  } = userData;

  const prompt = `
Utilize os dados abaixo para gerar um plano nutricional${incluiTreino ? ' e de treino' : ''} personalizado em formato de **HTML e CSS**, adaptado para o modelo de layout do Nutrify. O conteúdo precisa estar diretamente pronto para ser inserido na função gerarHTMLReceita(), sem usar markdown:

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
- Sugira hábitos e suplementos com base no objetivo

${incluiTreino ? `Inclua um plano de treino semanal, com dias divididos, exercícios, repetições, tempo de descanso e observações.` : ''}

${incluiDiaLixo ? `Adicione uma seção chamada "Dia do Lixo" com instruções para uma refeição livre semanal, sugerindo como fazer sem perder os resultados.` : ''}

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

    const resposta = completion.choices?.[0]?.message?.content;

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
