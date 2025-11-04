import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PagamentosService {
  private base = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  getPagamentos(): Observable<any> {
  return this.http.get(`${this.base}/pagamentos`);
  }

  criarIntent(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      'x-merchant-key': payload.merchantKey || 'merchant-1762216302466-2977',
      'x-merchant-secret': payload.merchantSecret || '772fa627178e8fa91ef7c59e818d5e',
      'Content-Type': 'application/json'
    });
    // Monta o payload completo conforme esperado pela TrustPay
    const body = {
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      customer: payload.customer,
      callbackUrl: payload.callbackUrl,
      returnUrl: payload.returnUrl,
      installments: payload.installments
    };
    return this.http.post(`${this.base}/merchant/v1/payment-intents`, body, { headers });
  }

  capturarPagamento(intentId: string, body: any): Observable<any> {
    const headers = new HttpHeaders({
      'x-merchant-key': 'merchant-1762216302466-2977',
      'x-merchant-secret': '772fa627178e8fa91ef7c59e818d5e',
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.base}/merchant/v1/payments/${intentId}/capture`, body, { headers });
  }
}
