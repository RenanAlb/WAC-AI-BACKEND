import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sendEmail from "./nodemailer.js";
import connectToDataBase from "./database/mongodb.js";
import Messages from "./modules/messages.js";

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

const chatHistory = [];

const addMessageToDataBase = async (role, content) => {
  console.log(
    `Adicionando mensagem => (${content}) do tipo => (${role}) para o banco de dados...`
  );
  try {
    const addMessage = new Messages({
      messages: [
        {
          role: role,
          content: content,
        },
      ],
    });

    await addMessage.save();
    console.log("Mensagem adicionada ao banco de dados!");
  } catch (error) {
    console.error("Erro ao adicionar a mensagem ao banco de dados:", error);
  }
};

const getMessagesFromDataBase = async () => {
  chatHistory.push({
    role: "system",
    content: `
    Você é a Wac AI, uma assistente de IA simpática e especializada no sistema Web API C# (Wac = Web API C#).
    Sua função:
    - Responder dúvidas sobre o sistema, frontend e backend.
    - Executar ações para adicionar, atualizar e remover pessoas na lista, quando solicitado.
    - Enviar emails quando solicitado.
    - Responder sempre em JSON válido.

    📄 **Documentação do sistema:**
    ${documentation}

    📌 **Formato de resposta SEMPRE em JSON válido**:
    {
      "mensagem": "Texto natural para o usuário",
      "acao": {
        "nome_funcao": "addUser | updateUser | deleteUser | sendEmail",
        "argumentos": {
          "nome_pessoa": "Nome da pessoa OU null",
          "id_pessoa": "ID da pessoa OU null",
          "email_destinatario": "Email para enviar a mensagem OU null",
          "email_mensagem": "Conteúdo da mensagem do email OU null" 
        }
      }
    }

    Regras:
    - Se o usuário não pedir nenhuma ação, coloque "acao": null.
    - "mensagem" deve ser sempre amigável, como se fosse uma conversa normal.
    - Use apenas funções definidas: addUser, updateUser, deleteUser, sendEmail.
    - Se a ação não exigir algum argumento, defina-o como null.
    - Retorne **exclusivamente** o JSON, sem texto antes ou depois.
    - Retorne **somente** um JSON, sem textos antes ou depois. 
    - Ao executar alguma ação, deixe explícito no campo "mensagem" o que está sendo feito.
    - Ao enviar emails, certifique-se de que há algum email no campo "email_destinatario" e o conteúdo da mensagem em "email_mensagem" no JSON.

    **EXTRA**
    - Você pode utilizar códigos HTML para mostrar os resultados ao usuário no campo "mensagem" do formato JSON (tables, divs, gráficos), principalmente se o usuário pedir.
    - O background do chat onde o usuário interage com você é escuro (#1A1A1A), por isso, faça combinações de cores que façam contraste para bom entendimento do que está escrito. Exemplo: cor branca para texto quando não houver background apropriado.
    `,
  });

  try {
    const getMessages = await Messages.find();
    console.log(getMessages);

    if (getMessages.length !== 0) {
      console.log("Mensagens buscadas!");
      getMessages.map((e) => {
        chatHistory.push({
          role: e.messages[0].role,
          content: e.messages[0].content,
        });
      });
    }

    return getMessages;
  } catch (error) {
    console.error("Erro ao buscar as mensagens do banco");
    console.error(error);
  }
};

const getTableListUsers = async () => {
  try {
    const response = await fetch(
      "https://web-api-csharp-backend.onrender.com/person"
    );

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
    console.error("Erro no fetch:", error.message);
  }
};

// Rotas
app.post("/ask-wac-ai", async (req, res) => {
  const { question } = req.body;

  console.log("Buscando conversas anteriores...");
  const mensagensSalvas = await getMessagesFromDataBase();

  // Chamada Web API C#
  await getTableListUsers();

  console.log("Atualizando memória...");
  chatHistory.push({ role: "user", content: question });

  // Adicionar mensagem ao banco de dados
  await addMessageToDataBase("user", question);

  // Chamando IA
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
      const errorText = await response.text();
      console.error(
        "Erro da API:",
        response.status,
        response.statusText,
        errorText
      );
      throw new Error("Erro ao chamar a API!");
    }

    const data = await response.json();
    const result = data.choices[0].message.content;
    console.log("Resposta gerada: ", result);

    const aiData = JSON.parse(result);

    // Adicionar mensagem da IA para o Database
    await addMessageToDataBase("system", aiData.mensagem);

    console.log("Mensagem para o usuário: ", aiData.mensagem);
    console.log("Ação solicitada: ", aiData.acao);

    let resultadoAcao = null;

    async function tratarResposta(res) {
      if (!res.ok) {
        const textoErro = await res.text();
        console.error(`Erro na API (${res.status}):`, textoErro);
        return { erro: true, status: res.status, mensagem: textoErro };
      }

      try {
        return await res.json();
      } catch {
        return {
          erro: true,
          status: res.status,
          mensagem: "Resposta não é JSON",
        };
      }
    }

    if (aiData.acao) {
      if (aiData.acao.nome_funcao === "addUser") {
        console.log(
          "Wac AI está criando um novo usuário:",
          aiData.acao.argumentos.nome_pessoa
        );

        resultadoAcao = await fetch(
          "https://web-api-csharp-backend.onrender.com/person",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: aiData.acao.argumentos.nome_pessoa }),
          }
        ).then(tratarResposta);
      } else if (aiData.acao.nome_funcao === "updateUser") {
        console.log(
          "Wac AI está atualizando o usuário:",
          aiData.acao.argumentos.nome_pessoa
        );

        resultadoAcao = await fetch(
          `https://web-api-csharp-backend.onrender.com/person/${aiData.acao.argumentos.id_pessoa}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: aiData.acao.argumentos.nome_pessoa,
            }),
          }
        ).then(tratarResposta);
      } else if (aiData.acao.nome_funcao === "deleteUser") {
        console.log(
          "Wac AI está deletando o usuário:",
          aiData.acao.argumentos.id_pessoa
        );

        resultadoAcao = await fetch(
          `https://web-api-csharp-backend.onrender.com/person/${aiData.acao.argumentos.id_pessoa}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }
        ).then(tratarResposta);
      } else if (aiData.acao.nome_funcao === "sendEmail") {
        console.log("Wac AI está enviando um email...");

        const info = await sendEmail(
          aiData.acao.argumentos.email_destinatario,
          aiData.acao.argumentos.email_mensagem
        );

        console.log("E-mail enviado:", info.response);
        resultadoAcao = info;
      }
    }

    console.log("Atualizando a memória...");
    chatHistory.push({ role: "system", content: result });

    chatHistory.splice(0, chatHistory.length);

    res.status(200).json({
      message: "Sucesso! Resposta gerada da Wac AI!",
      ok: true,
      answer: aiData.mensagem,
      acao_executada: resultadoAcao,
      history_messages: mensagensSalvas,
    });
  } catch (error) {
    console.error("Erro ao gerar resposta:", error);
    res.status(500).json({ message: error.message, ok: false });
  }
});

// Iniciar o servidor
const startServer = async () => {
  await connectToDataBase(); // espera a conexão

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
