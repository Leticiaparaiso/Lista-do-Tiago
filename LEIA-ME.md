# Lista de presentes: como colocar no ar

A pasta tem 4 arquivos:

- `index.html` é o site. Você não precisa mexer nele.
- `lista.json` guarda os dados: nome do bebê, Pix, WhatsApp e itens. É o único arquivo que muda.
- `render.yaml` é a configuração do Render.
- `LEIA-ME.md` é este guia.

## 1. Subir os arquivos no GitHub (uma vez)

1. Entre no github.com e clique em **New repository**.
2. Dê um nome, por exemplo `lista-presentes`, e deixe como **Public**. Clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste os 4 arquivos (não a pasta) e clique em **Commit changes**.

## 2. Criar o site no Render (uma vez)

1. No painel do Render, clique em **New** e depois em **Static Site**.
2. Escolha o repositório `lista-presentes`. Se ele não aparecer, clique em **Configure GitHub** e libere o acesso a ele.
3. Preencha assim:
   - **Build Command**: deixe vazio.
   - **Publish Directory**: `.` (só um ponto).
4. Clique em **Create Static Site**. Em um ou dois minutos aparece o link, algo como `https://lista-presentes.onrender.com`. Esse é o link para mandar para as pessoas.

Sites estáticos no Render são gratuitos e não "dormem", então a página abre rápido mesmo sem visitas.

## 3. Preencher a lista

1. Abra o seu link com `?editar` no final, por exemplo `https://lista-presentes.onrender.com/?editar`.
2. Toque em **Editar lista**. Coloque o nome do bebê, a chave Pix, o nome do titular, a cidade e o seu WhatsApp. Ajuste os itens.
3. Toque em **Baixar lista.json**. O arquivo vai para os downloads do celular ou do computador.
4. No GitHub, abra o repositório, clique em **Add file** e depois em **Upload files**, arraste o `lista.json` novo e clique em **Commit changes**. O arquivo antigo é substituído.
5. O Render atualiza o site sozinho em cerca de um minuto.

Faça isso sempre que quiser mudar algo: marcar um presente como escolhido, atualizar o valor arrecadado de uma vaquinha ou adicionar itens.

Importante: o editor sempre parte da versão que está no ar. Então baixe e envie o `lista.json` logo depois de editar, antes de começar outra edição.

## Antes de divulgar

- Faça um Pix de teste de R$ 1 pelo QR code e confira se cai na sua conta com o nome certo.
- Teste também o botão de vaquinha com um valor pequeno.
- O endereço com `?editar` não dá acesso a nada: quem abrir só consegue baixar uma cópia, sem mudar o site. Mesmo assim, compartilhe apenas o link normal.
