# Frontend (Angular)

Um frontend Angular mínimo foi scaffoldado em `./frontend`.

Para executar em desenvolvimento (com proxy para `http://localhost:3000`):

```powershell
cd .\frontend
npm start -- --proxy-config proxy.conf.json
```

Isso inicia a app em `http://localhost:4200` e encaminha chamadas `GET/POST` para `/api/*` ao backend em `http://localhost:3000`.

Se preferir usar o Angular CLI diretamente:

```powershell
cd .\frontend
npx ng serve --proxy-config proxy.conf.json
```

Observações:
- O arquivo `proxy.conf.json` já foi criado em `./frontend` apontando para `http://localhost:3000`.
- Se o backend usa outra porta, atualize `proxy.conf.json` com a URL correta.
