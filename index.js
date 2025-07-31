import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Configuração do dotenv
dotenv.config();

// Configuração do servidor
const app = express();
const port = process.env.PORT || 8080;

// Ler arquivos de guia IA
const backendDoc = fs.readFileSync(
  path.join(process.cwd(), "docs", "backend-guide.md"),
  "utf-8"
);

const frontendDoc = fs.readFileSync(
  path.join(process.cwd(), "docs", "frontend-guide.md"),
  "utf-8"
);

const documentation = `
=== DOCUMENTAÇÃO FRONTEND ===
${frontendDoc}

=== DOCUMENTAÇÃO BACKEND === 
${backendDoc}
`;

// Middlewares
app.use(
  cors({
    origin: `${process.env.LINK_SITE_FRONTEND}`,
    credentials: true,
  })
);
app.use(express.json());

const chatHistory = [
  {
    role: "system",
    content: `
      Você é uma assistente de IA chamada Wac AI, vem de (Web API C# => Wac). Sua função é ser um suporte especializado no projeto Web API C#.
      Aqui está a documentação do código que você deve usar para responder perguntas:
      
      ${documentation}

      Atenção: Sempre responda baseado nessas informações.
    `,
  },
];

// Rotas
app.post("/ask-wac-ai", async (req, res) => {
  const { question } = req.body;

  let dataAPI;
  try {
    const response = await fetch("http://localhost:5123/person");
    if (!response.ok) throw new Error("Erro ao buscar informações da AI");

    const data = await response.json();

    dataAPI = data;
  } catch (error) {
    console.error(error);
  }

  chatHistory.push({
    role: "system",
    content: `
    Aqui você recebe lista mais atualizada das pessoas cadastradas na tabela a cada pergunta do usuário (caso seja necessário seu uso):

    ${dataAPI}

    Observações: 
    - Se estiver vazio [] significa que os dados no banco de dados foram resetados.
  `,
  });
  chatHistory.push({ role: "user", content: question });

  try {
    const response = await fetch(`${process.env.OPENROUTER_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Baerer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": `${process.env.LINK_SITE_FRONTEND}`,
        "X-Title": "Wac AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tngtech/deepseek-r1t2-chimera:free",
        messages: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao chamar a API!");
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    chatHistory.push({ role: "system", content: result });

    res.status(200).json({
      message: "Sucesso! Resposta gerada da Wac AI!",
      ok: true,
      answer: result,
    });
  } catch (error) {
    console.error("Erro ao gerar resposta:", error);
    res.status(500).json({ message: error.message, ok: false });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
