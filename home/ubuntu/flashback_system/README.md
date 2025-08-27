# Sistema Completo Convite Flashback

Este repositório contém o código-fonte completo para o sistema de convite interativo Flashback, que inclui um frontend (o convite em si) e um backend (o sistema administrativo para gerenciar RSVPs e pratos).

## Estrutura do Repositório

```
./
├── frontend_code/       # Código do convite interativo (React)
│   └── README.md        # Instruções específicas do frontend
├── backend_code/        # Código do sistema administrativo (Flask)
│   └── README.md        # Instruções específicas do backend
└── README.md            # Este arquivo
```

## Visão Geral do Sistema

-   **Frontend (Convite):** Um site interativo com tema "De Volta para o Futuro", música "Take On Me" do A-ha, formulário de RSVP com PIX e um sistema colaborativo de cardápio onde os convidados escolhem um prato para levar.
-   **Backend (Administrativo):** Um painel de controle para o administrador da festa gerenciar os RSVPs, controlar a disponibilidade dos pratos, adicionar/remover/editar convidados e visualizar estatísticas em tempo real.

## Como Configurar e Rodar o Sistema Completo

Para ter o sistema completo funcionando, você precisará configurar e rodar tanto o frontend quanto o backend. É **altamente recomendado** que você configure o backend primeiro, pois o frontend dependerá dele para funcionar corretamente.

### 1. Configurar e Rodar o Backend (Sistema Administrativo)

O backend é desenvolvido em Python com o framework Flask.

1.  **Navegue até o diretório do backend:**
    ```bash
    cd /home/ubuntu/backend_code
    ```

2.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Defina a variável de ambiente Flask:**
    ```bash
    export FLASK_APP=src/main.py
    ```

5.  **Inicie o servidor Flask:**
    ```bash
    flask run
    ```

    O servidor Flask estará rodando, geralmente em `http://127.0.0.1:5000`. O painel administrativo estará acessível em `http://127.0.0.1:5000/admin`.

    **Importante:** Para que o frontend possa se comunicar com o backend, o backend precisa estar acessível publicamente ou na mesma rede. Se você estiver rodando localmente, o frontend também precisará ser configurado para apontar para `http://127.0.0.1:5000`.

### 2. Configurar e Rodar o Frontend (Convite Interativo)

O frontend é desenvolvido em React.

1.  **Navegue até o diretório do frontend:**
    ```bash
    cd /home/ubuntu/frontend_code
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure a URL do Backend:**
    Você precisará informar ao frontend onde o backend está rodando. Abra o arquivo `src/App.jsx` dentro do diretório `frontend_code` e localize a linha onde a URL da API é definida (procure por `const API_URL`). Altere-a para a URL do seu backend (por exemplo, `http://127.0.0.1:5000`).

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

    Isso iniciará o servidor de desenvolvimento do frontend, geralmente em `http://localhost:5173`. Você poderá acessar o convite em seu navegador.

### 3. Publicando em Produção

Para publicar o sistema em um servidor de produção:

-   **Backend:** Você pode usar um servidor WSGI como Gunicorn ou uWSGI para servir a aplicação Flask, e um servidor web como Nginx ou Apache como proxy reverso. Consulte a documentação do Flask para implantação em produção.
-   **Frontend:** Após executar `npm run build` no diretório `frontend_code`, uma pasta `dist` será criada. O conteúdo dessa pasta pode ser servido por qualquer servidor web estático (Nginx, Apache, Vercel, Netlify, etc.).

Certifique-se de que a URL da API no frontend (`src/App.jsx`) aponte para a URL pública do seu backend em produção.

---

Esperamos que este guia ajude você a configurar e implantar seu sistema de convite Flashback! Se tiver alguma dúvida, consulte os `README.md` específicos de cada módulo (`frontend_code/README.md` e `backend_code/README.md`).


