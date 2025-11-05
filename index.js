// ...existing code...
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
// ...existing code...

// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:51594' }));
app.use(express.json());

// Endpoint para receber notificações TrustPay (webhook)
app.post('/webhooks/trustpay', (req, res) => {
  console.log('Webhook TrustPay recebido:', req.body);
  // Aqui você pode processar o status do pagamento, atualizar banco, etc.
  res.status(200).json({ received: true });
});

// Endpoint para redirecionamento após pagamento (returnUrl)
app.get('/checkout/success', (req, res) => {
  res.send('<h2>Pagamento realizado com sucesso!</h2>');
});

// Endpoint para criar intent de pagamento
// Novo endpoint compatível com frontend/proxy
app.post('/api/merchant/v1/payment-intents', async (req, res) => {
  try {
    // Dados do pagamento recebidos do cliente
    // Repasse todos os campos recebidos no body para o TrustPay
    const { merchantKey, merchantSecret, ...payload } = req.body;
    // Ajusta o campo amount para inteiro (centavos)
    const intentPayload = {
      ...payload,
      amount: Number(payload.amount),
      installments: payload.installments ? { quantity: Number(payload.installments) } : undefined
    };
    console.log('--- [INTENT] Requisição recebida:', JSON.stringify(req.body, null, 2));
    const method = 'POST';
    const path = '/api/merchant/v1/payment-intents';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = JSON.stringify(intentPayload);
    const signatureBase = `${method}\n${path}\n${timestamp}\n${rawBody}`;
    const signature = crypto.createHmac('sha256', merchantSecret || '772fa627178e8fa91ef7c59e818d5e').update(signatureBase).digest('hex');
    const response = await axios.post(
      `https://sistema-de-pagamentos-backend.onrender.com${path}`,
      intentPayload,
      {
        headers: {
          'x-api-key': merchantKey || 'merchant-1762216302466-2977',
          'x-timestamp': timestamp,
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('--- [INTENT] Resposta TrustPay:', JSON.stringify(response.data, null, 2));
      // Remove o campo 'status' da resposta do intent
      const { status, ...intentWithoutStatus } = response.data;
      res.json(intentWithoutStatus);
  } catch (err) {
    if (err.response) {
      console.error('--- [INTENT] ERRO TrustPay:', {
        status: err.response.status,
        statusText: err.response.statusText,
        headers: err.response.headers,
        data: err.response.data
      });
      res.status(err.response.status || 500).json({
        error: err.response.data || err.message,
        status: err.response.status,
        statusText: err.response.statusText
      });
    } else {
      console.error('--- [INTENT] ERRO TrustPay:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// Endpoint antigo mantido para compatibilidade
app.post('/pay', async (req, res) => {
  try {
    // Dados do pagamento recebidos do cliente
    const { orderId, amount, currency, paymentMethod, customer, callbackUrl, returnUrl, installments, merchantKey, merchantSecret } = req.body;
    const payload = {
      orderId,
      amount,
      currency,
      paymentMethod,
      customer,
      callbackUrl,
      returnUrl,
      installments
    };
    const method = 'POST';
    const path = '/api/merchant/v1/payment-intents';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = JSON.stringify(payload);
    const signatureBase = `${method}\n${path}\n${timestamp}\n${rawBody}`;
    const signature = crypto.createHmac('sha256', merchantSecret || '772fa627178e8fa91ef7c59e818d5e').update(signatureBase).digest('hex');
    const response = await axios.post(
      `https://sistema-de-pagamentos-backend.onrender.com${path}`,
      payload,
      {
        headers: {
          'x-api-key': merchantKey || 'merchant-1762216302466-2977',
          'x-timestamp': timestamp,
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para capturar pagamento
app.post('/api/merchant/v1/payments/:intentId/capture', async (req, res) => {
  try {
    const intentId = req.params.intentId;
    const { cardNumber, cardHolderName, expirationMonth, expirationYear, cvv, merchantKey, merchantSecret } = req.body;
    // Inclui intentId no payload para TrustPay se necessário
    const payload = {
      cardNumber,
      cardHolderName,
      expirationMonth,
      expirationYear,
      cvv,
      intentId // TrustPay pode exigir esse campo no corpo
    };
    console.log('--- [CAPTURE] Requisição recebida:', JSON.stringify(req.body, null, 2));
    const method = 'POST';
    const path = `/api/merchant/v1/payments/${intentId}/capture`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = JSON.stringify(payload);
    const signatureBase = `${method}\n${path}\n${timestamp}\n${rawBody}`;
    const signature = crypto.createHmac('sha256', merchantSecret || '772fa627178e8fa91ef7c59e818d5e').update(signatureBase).digest('hex');
    const response = await axios.post(
      `https://sistema-de-pagamentos-backend.onrender.com${path}`,
      payload,
      {
        headers: {
          'x-api-key': merchantKey || 'merchant-1762216302466-2977',
          'x-timestamp': timestamp,
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      }
    );
  console.log('--- [CAPTURE] Resposta TrustPay:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      // Exibe detalhes completos do erro, inclusive 'details' se existir
      const errorData = err.response.data;
      console.error('--- [CAPTURE] ERRO TrustPay:', {
        status: err.response.status,
        statusText: err.response.statusText,
        headers: err.response.headers,
        data: errorData,
        details: errorData?.error?.details || null
      });
      res.status(err.response.status || 500).json({
        error: errorData || err.message,
        status: err.response.status,
        statusText: err.response.statusText,
        details: errorData?.error?.details || null
      });
    } else {
      console.error('--- [CAPTURE] ERRO TrustPay:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(3001, () => {
  console.log('API de pagamentos rodando na porta 3001');
});
