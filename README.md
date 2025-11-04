# API de Pagamentos (Integração TrustPay)

Esta API expõe endpoints para criar intents de pagamento e capturar pagamentos utilizando as rotas do TrustPay.

## Instalação

```powershell
cd c:\Users\Eduardo\OneDrive\Desktop\Projetos2025\api-pagamentos
npm install
```

## Uso

```powershell
npm start
```

A API estará disponível em `http://localhost:3000`

### Endpoints

- `POST /pay`
  - Body: `{ amount, currency, paymentMethod, customer }`
  - Chama `/api/intents` do TrustPay e retorna o resultado.

- `POST /capture`
  - Body: `{ intentId }`
  - Chama `/api/capture` do TrustPay e retorna o resultado.

## Exemplo de chamada

```powershell
# Criar intent
curl -X POST http://localhost:3000/pay -H "Content-Type: application/json" -d '{ "amount": 100, "currency": "BRL", "paymentMethod": "credit_card", "customer": { "name": "João", "email": "joao@email.com", "document": "123.456.789-00" } }'

# Capturar pagamento
curl -X POST http://localhost:3000/capture -H "Content-Type: application/json" -d '{ "intentId": "id_da_intent" }'
```
