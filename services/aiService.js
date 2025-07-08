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
    incluiTreino = false
  } = userData;

  const prompt = `
Utilize as informações abaixo para criar um plano nutricional ${incluiTreino ? 'e de treino' : ''} totalmente personalizado, integrado e formatado para exportação em PDF. Siga as instruções conforme descritas:

Peso: ${peso}
Altura: ${altura}
Idade: ${idade}
Gênero: ${genero}
Objetivo: ${objetivo}
Calorias Diárias Recomendadas: ${calorias}

Alimentos para Café da Manhã: ${alimentosSelecionadosCafe}
Alimentos para Almoço: ${alimentosSelecionadosAlmoco}
Alimentos para Lanche: ${alimentosSelecionadosLanche}
Alimentos para Jantar: ${alimentosSelecionadosJanta}

Frequência de Treino: ${frequenciaTreino}
Nome do Plano: ${planoNome}

Instruções para o Plano Nutricional:

Divisão das Refeições:
Café da Manhã: 20% das calorias diárias – utilizar ${alimentosSelecionadosCafe}.
Lanche da Manhã: 15% das calorias diárias – utilizar ${alimentosSelecionadosLanche}.
Almoço: 25% das calorias diárias – utilizar ${alimentosSelecionadosAlmoco}.
Incluir combinações de carboidrato, proteína e legumes (60/30/10).
Se "Arroz" estiver entre os alimentos, garantir sua presença em todas as opções de almoço.
Lanche da Tarde: 15% das calorias diárias – utilizar ${alimentosSelecionadosLanche}.
Jantar: 25% das calorias diárias – utilizar ${alimentosSelecionadosJanta}.
Seguir as mesmas diretrizes do almoço.

Quantidade e Distribuição:
Ajustar as quantidades (em gramas) para atingir exatamente a meta calórica de cada refeição, apresentando o total de calorias de cada opção sem discriminar as calorias individuais dos alimentos.

Horários e Mensagens:
Incluir os horários recomendados para cada refeição e, após a última opção de almoço ou lanche da tarde, inserir a mensagem ou alimento indicado (ex.: chocolate).

Formatação das Receitas:
Utilize a hierarquia:
# para Títulos Principais
## para Subtítulos
### para Detalhes
#### para Subdetalhes
Organize cada refeição (Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde e Jantar) em linhas separadas para cada alimento.

Não adicione nenhum texto ou mensagem antes ou depois do conteúdo gerado, apenas o conteúdo solicitado.

Instruções para o Plano Personalizado (Nutrição${incluiTreino ? ', Treino' : ''} e Estilo de Vida):

Dados do Usuário e Avaliação:
Exibir: Nome do Plano (${planoNome}), Gênero (${genero}), Peso (${peso} kg), Altura (${altura} cm), Idade (${idade} anos), Objetivo (${objetivo}) e Calorias Diárias (${calorias} kcal).
Calcular e exibir o IMC, indicando se o usuário está acima, abaixo ou no peso ideal, e determinar a quantidade mínima de água recomendada (em ml ou litros).
Incluir avaliação sobre hábitos alimentares, qualidade do sono e nível de energia, com sugestões de melhorias, se necessário.

Plano Alimentar Detalhado:
Para cada refeição, oferecer pelo menos duas opções:
Opção X: Nome do Prato – Total de Calorias
Ingredientes: Listar os ingredientes e quantidades (em gramas) para atingir a meta calórica.
Substituições: Apresentar opções alternativas para proteínas, carboidratos e gorduras.
Para o almoço, garantir a inclusão mínima de 100g de arroz e feijão (se presentes).

${incluiTreino ? `Plano de Treino Personalizado:
Organizar uma divisão semanal de treinos conforme frequência ${frequenciaTreino} e gênero ${genero}.
Para cada dia, detalhar os grupos musculares trabalhados (ex.: Segunda-feira: Peito e Tríceps; Terça-feira: Costas e Bíceps; etc.).
Para cada exercício, especificar:
- Nome do Exercício
- Séries x Repetições
- Tempo de Descanso Recomendado
- Dicas de Execução
Incluir variações conforme o nível de energia e experiência do usuário.
` : ''}

Suplementação Específica:
Se o objetivo for ganho de massa: recomendar whey protein, creatina, albumina e BCAAs.
Se for emagrecimento: sugerir proteínas de absorção lenta (ex.: caseína), L-carnitina e termogênicos naturais (chá verde, cafeína).
Se for resistência: indicar beta-alanina, maltodextrina e eletrólitos.
Ressaltar que a suplementação deve ser ajustada com orientação profissional.

Dicas de Estilo de Vida e Comportamento:
Incluir recomendações para gerenciamento de estresse, melhoria da qualidade do sono, hidratação (quantidade mínima de água com base no peso) e práticas de mindfulness e relaxamento.

Lista de Compras:
Gerar uma lista completa de ingredientes (somando as quantidades necessárias para o período planejado), organizada por grupos (proteínas, carboidratos, vegetais, frutas, gorduras, etc.), incluindo os suplementos recomendados.

Requisitos Gerais:
Integrar o plano alimentar${incluiTreino ? ', de treino' : ''} e as dicas de estilo de vida de forma coerente, garantindo que as necessidades calóricas e nutricionais estejam alinhadas ao objetivo.
Certificar que o conteúdo seja claro, organizado e estruturado para fácil compreensão e exportação em PDF.
Não adicionar mensagens ou comentários extras antes ou após o conteúdo gerado.
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