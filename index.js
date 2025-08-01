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
    Você é a Wac AI, uma assistente de IA simpática e especializada no sistema Web API C# (Wac = Web API C#).
    Sua função:
    - Responder dúvidas sobre o sistema, frontend e backend.
    - Executar ações para adicionar, atualizar e remover pessoas na lista, quando solicitado.

    📄 **Documentação do sistema:**
    ${documentation}

    📌 **Formato de resposta SEMPRE em JSON válido**:
    {
      "mensagem": "Texto natural para o usuário",
      "acao": {
        "nome_funcao": "addUser | updateUser | deleteUser",
        "argumentos": {
          "nome_pessoa": "Nome da pessoa OU null",
          "id_pessoa": "ID da pessoa OU null"
        }
      }
    }

    Regras:
    - Se o usuário não pedir nenhuma ação, coloque "acao": null.
    - "mensagem" deve ser sempre amigável, como se fosse uma conversa normal.
    - Use apenas funções definidas: addUser, updateUser, deleteUser.
    - Se a ação não exigir algum argumento, defina-o como null.
    - Retorne **apenas o JSON** sem explicações extras.
    `,
  },
];

// Rotas
app.post("/ask-wac-ai", async (req, res) => {
  const { question } = req.body;

  // Chamada Web API C#
  try {
    const response = await fetch(
      "https://web-api-csharp-backend.onrender.com/person"
    );

    console.log("");
    if (!response.ok) {
      const text = await response.text();
      console.error("Resposta de erro do backend C#:", text);
      throw new Error("Erro ao buscar informações da AI");
    }

    const data = await response.json();

    const list = data
      .map((user) => `nome: ${user.name} id: ${user.id}`)
      .join("\n");

    chatHistory.push({
      role: "system",
      content: `
    Aqui você recebe lista mais atualizada das pessoas cadastradas na tabela a cada pergunta do usuário (caso seja necessário seu uso):

    ${list}

    Observações: 
    - Se estiver vazio [] significa que os dados no banco de dados foram resetados.
  `,
    });
    console.log("Atualizando memória...");
  } catch (error) {
    console.error("Erro no fetch:", error);
    dataAPI = [];
  }
  // Chamada Web API C#

  chatHistory.push({ role: "user", content: question });
  console.log("Atualizando memória...");

  try {
    console.log("Gerando resposta...");
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
    console.log("Resposta gerada: ", result);

    const aiData = JSON.parse(result);

    console.log("Mensagem para o usuário: ", aiData.mensagem);
    console.log("Ação solicitada: ", aiData.acao);

    let resultadoAcao = null;
    if (aiData.acao) {
      if (aiData.acao.nome_funcao === "createUser") {
        console.log(
          "Wac AI está criando um novo usuário: ",
          aiData.acao.argumentos.nome_pessoa
        );

        resultadoAcao = await fetch(
          "https://web-api-csharp-backend.onrender.com/person",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: aiData.acao.argumentos.nome_pessoa }),
          }
        ).then((r) => r.json());
      } else if (aiData.acao.nome_funcao === "updateUser") {
        console.log(
          "Wac AI está atualizando o usuário: ",
          aiData.acao.argumentos.nome_pessoa
        );

        resultadoAcao = await fetch(
          "https://web-api-csharp-backend.onrender.com/person",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: aiData.acao.argumentos.nome_pessoa,
              id: aiData.acao.argumentos.id_pessoa,
            }),
          }
        ).then((r) => r.json());
      } else if (aiData.acao.nome_funcao === "deleteUser") {
        console.log(
          "Wac AI está deletando o usuário: ",
          aiData.acao.argumentos.id_pessoa
        );

        resultadoAcao = await fetch(
          "https://web-api-csharp-backend.onrender.com/person",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: aiData.acao.argumentos.id_pessoa }),
          }
        ).then((r) => r.json());
      }
    }

    console.log("Atualizando a memória...");
    chatHistory.push({ role: "system", content: result });

    res.status(200).json({
      message: "Sucesso! Resposta gerada da Wac AI!",
      ok: true,
      answer: result,
      acao_executada: resultadoAcao,
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
