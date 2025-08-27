# Convite Interativo Flashback (Frontend)

Este diretório contém o código-fonte completo do convite interativo Flashback.

## Estrutura do Projeto

```
flashback-invite/
├── public/
│   └── music/
│       └── take-on-me.mp3
├── src/
│   ├── App.css
│   ├── App.jsx
│   └── data/
│       └── menu.js
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

## Como Rodar Localmente

1.  **Navegue até o diretório do projeto:**
    ```bash
    cd /home/ubuntu/frontend_code
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

    Isso iniciará o servidor de desenvolvimento e você poderá acessar o convite em seu navegador (geralmente em `http://localhost:5173`).

## Como Publicar (Build para Produção)

Para preparar o convite para publicação em um servidor de produção:

1.  **Navegue até o diretório do projeto:**
    ```bash
    cd /home/ubuntu/frontend_code
    ```

2.  **Execute o comando de build:**
    ```bash
    npm run build
    ```

    Isso criará uma pasta `dist` no diretório raiz do projeto, contendo todos os arquivos estáticos otimizados para produção. Você pode então fazer o upload do conteúdo da pasta `dist` para o seu servidor web (Apache, Nginx, etc.).

## Observações

-   A música "Take On Me" (A-ha) é carregada via YouTube. Certifique-se de que o ambiente de publicação permite o carregamento de iframes do YouTube.
-   O sistema de RSVP se comunica com o backend. Certifique-se de que o backend esteja configurado e acessível.


