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
    - Macros equilibrados com base no objetivo e no histórico de saúde
  - Nunca induzir o cliente a consumir mais de uma opção por refeição

- Inclua **substituições inteligentes** para proteínas, carboidratos e gorduras, respeitando o histórico de saúde
- **Sugira hábitos saudáveis e suplementos** com base no objetivo (respeitando o histórico de saúde)

${lixoAtivo ? `
🍕 **Inclua uma seção completa chamada "Dia do Lixo":**
- Título: “Dia do Lixo”
- Parágrafo explicando detalhadamente o conceito de refeição livre:
  - A ideia do Dia do Lixo é oferecer uma flexibilidade estratégica para reduzir a ansiedade alimentar, melhorar a adesão à dieta e estimular o metabolismo.
  - Explique que não se trata de uma licença para exagerar, mas sim de uma oportunidade planejada de consumir alimentos que normalmente não fazem parte da dieta.
- Liste orientações práticas claras, como:
  - Dê preferência a 1 refeição livre (e não o dia inteiro)
  - Evite exageros que possam comprometer a digestão ou o bem-estar no dia seguinte
  - Evite consumo excessivo de álcool ou frituras em excesso
  - Mastigue bem, saboreie o momento e evite culpa
- Sugira alimentos que podem ser incluídos como exemplo (pizza, hambúrguer artesanal, sobremesa moderada etc.)
- Indique o **melhor momento da semana para aplicar**, considerando o objetivo:
  - Emagrecimento: Sábado à noite ou Domingo no almoço
  - Hipertrofia: Após o treino mais intenso da semana
  - Reeducação alimentar: Em eventos sociais ou comemorações
- Finalize com um reforço motivacional, como:
  - “A liberdade com consciência é o segredo de uma dieta sustentável.”
` : ''}

${treinoAtivo ? `
🏋️ **Inclua uma seção completa chamada "Plano de Treino Personalizado":**
- Título: "Plano de Treino Semanal"
- Apresente um parágrafo explicando que o treino é adaptado conforme objetivo, frequência e histórico de saúde informado.
- Divida a semana com foco muscular e com objetivos claros:
  - Segunda: Peito + Tríceps
  - Terça: Costas + Bíceps
  - Quarta: Pernas + Glúteos
  - Quinta: Abdômen + Cardio
  - Sexta: Corpo inteiro (Fullbody) ou circuito funcional
  - Sábado: Alongamento, yoga ou descanso ativo
  - Domingo: Descanso total ou caminhada leve
- Para cada dia, liste de 4 a 6 exercícios com:
  - Nome do exercício
  - Número de séries
  - Repetições
  - Tempo de descanso
  - Dicas técnicas (postura, respiração, execução)
- Adicione variações para treinos em casa e com ou sem equipamentos (halteres, elásticos, peso corporal)
- Inclua observações específicas como:
  - Como ajustar a carga de acordo com o nível do aluno
  - Como identificar sinais de overtraining ou dores indevidas
  - Como progredir a dificuldade ao longo das semanas
- Finalize com um bloco motivacional:
  - “Treino inteligente é aquele que respeita seu corpo e avança junto com ele.”
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
