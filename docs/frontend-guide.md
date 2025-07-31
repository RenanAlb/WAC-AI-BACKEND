# Guia do Frontend - Web API C#

Este guia descreve como navegar e usar o **frontend** do sistema **Web API C#**, ajudando o usuário a executar ações como visualizar, adicionar, editar e remover pessoas.

---

## 1. Tela Inicial

- No topo da tela, existem **4 botões** alinhados horizontalmente:

  1. **GET** – Cor verde – Atualiza a lista de pessoas cadastradas.
  2. **POST** – Cor laranja – Adiciona uma nova pessoa.
  3. **PUT** – Cor azul – Edita o nome de uma pessoa existente.
  4. **DELETE** – Cor vermelha – Remove uma pessoa cadastrada.

- Logo abaixo dos botões, há uma **tabela** com duas colunas:

  - **Nome** – Nome da pessoa cadastrada.
  - **ID** – Identificador único (GUID) da pessoa.

- Ao lado de cada **ID**, existe um **ícone de copiar**.
  - Ao clicar neste ícone, o ID é copiado para a área de transferência.
  - Uma mensagem de confirmação **"ID copiado"** aparece ao lado, confirmando que a cópia foi bem-sucedida.

---

## 2. Atualizar Lista de Pessoas

1. Clique no botão **GET** (verde).
2. A tabela será atualizada com os dados mais recentes do banco.

---

## 3. Cadastrar Nova Pessoa

1. Clique no botão **POST** (laranja).
2. Uma janela de formulário aparecerá abaixo.
3. Preencha o campo **Nome** com o nome da nova pessoa.
4. Clique em **Adicionar Usuário** para confirmar.
5. A tabela será atualizada automaticamente com o novo registro.

---

## 4. Editar Pessoa

1. Clique no botão **PUT** (azul).
2. Uma janela de formulário aparecerá abaixo.
3. No campo **ID**, cole ou digite o identificador da pessoa.
   - **Dica:** Clique no ícone de copiar ao lado do ID na tabela e verifique se apareceu a mensagem **"ID copiado"** antes de colar no formulário.
4. No campo **Novo Nome**, digite o novo nome desejado.
5. Clique em **Atualizar usuário**.
6. A tabela será atualizada automaticamente com o novo nome.

---

## 5. Remover Pessoa

1. Clique no botão **DELETE** (vermelho).
2. Uma janela de formulário aparecerá abaixo.
3. No campo **ID**, cole ou digite o identificador da pessoa.
   - **Dica:** Clique no ícone de copiar ao lado do ID na tabela e verifique se apareceu a mensagem **"ID copiado"** antes de colar no formulário.
4. Clique em **Deletar usuário**.
5. A pessoa será excluída e a tabela será atualizada automaticamente.

---

## 6. Observações Importantes

- Sempre use o botão **GET** para garantir que a lista esteja atualizada antes de qualquer alteração.
- Os IDs devem ser copiados exatamente como aparecem na tabela para evitar erros.
- Ao copiar um ID, verifique sempre se a mensagem **"ID copiado"** apareceu — isso garante que a cópia foi feita corretamente.
- Após cada operação bem-sucedida, a tabela é atualizada automaticamente.
- Se um ID inválido for informado, a ação será ignorada e poderá aparecer uma mensagem de erro.
- Pode demorar alguns segundos para carregar a tabela de pessoas cadastradas na primeira vez que abrir o site.
- Link do site: https://web-api-csharp-frontend.onrender.com

---
