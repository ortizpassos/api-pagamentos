import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagamentosService } from '../pagamentos.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  private static ultimoId = 1;
  novoPagamento() {
    // Gera orderId sequencial com 5 dígitos
    this.formData.orderId = (HomeComponent.ultimoId++).toString().padStart(5, '0');
    this.formData.valor = '';
    this.dados = null;
    this.mensagem = null;
    this.erro = null;
    this.carregando = false;
  }
  formData = {
    orderId: 'ORDER-TESTE',
    valor: '299.90',
    installments: 1,
    nomeCliente: 'Usuario Teste',
    emailCliente: 'usuario@teste.com',
  callbackUrl: 'http://localhost:3001/webhooks/trustpay',
  returnUrl: 'http://localhost:3001/checkout/success',
    numero: '4001302606394832',
    nome: 'Usuario Teste',
    validade: '10/28',
    cvv: '123',
    cpf: '37076094053'
  };
  dados: any = null;
  erro: string | null = null;
  carregando = false;
    mensagem: string | null = null;

  constructor(private pagamentos: PagamentosService) {}

  pagar() {
  this.erro = null;
  this.dados = null;
  this.carregando = true;
  const [mes, ano] = this.formData.validade.split('/');
  // Corrige valor para centavos, aceitando ponto ou vírgula
  let valorStr = String(this.formData.valor).replace(',', '.');
  let valorFloat = parseFloat(valorStr);
  const valorCentavos = isNaN(valorFloat) ? 0 : Math.round(valorFloat);
    const intentPayload = {
      orderId: this.formData.orderId,
      amount: valorCentavos,
      currency: 'BRL',
      paymentMethod: 'credit_card',
      customer: {
        name: this.formData.nomeCliente,
        email: this.formData.emailCliente
      },
      callbackUrl: this.formData.callbackUrl,
      returnUrl: this.formData.returnUrl,
      installments: Number(this.formData.installments),
      merchantKey: 'merchant-1762216302466-2977',
      merchantSecret: '772fa627178e8fa91ef7c59e818d5e'
    };
    // 1. Criar intent
    this.pagamentos.criarIntent(intentPayload).subscribe({
      next: (intentRes) => {
        const status = intentRes?.data?.status || intentRes?.status;
        const intentId = intentRes?.data?.id || intentRes?.id || intentRes?.intentId;
        if (status === 'APPROVED') {
          this.dados = { intent: intentRes };
          this.mensagem = 'Pagamento já efetuado!';
          this.carregando = false;
        } else if (intentId) {
          // Payload da captura (dados do cartão)
          const capturePayload = {
            cardNumber: this.formData.numero.replace(/\s+/g, ''),
            cardHolderName: this.formData.nome,
            expirationMonth: mes,
            expirationYear: '20' + ano,
            cvv: this.formData.cvv
          };
          this.pagamentos.capturarPagamento(intentId, capturePayload).subscribe({
            next: (captureRes) => {
              this.dados = { intent: intentRes, capture: captureRes };
              // Mensagem de acordo com resposta da captura
              if (
                captureRes?.error?.message?.includes('Cartão não encontrado') ||
                (captureRes?.error && typeof captureRes?.error === 'string' && captureRes?.error.includes('Cartão não encontrado'))
              ) {
                this.mensagem = 'Pagamento negado! Cartão inválido.';
              } else if (
                (captureRes?.success && (captureRes?.data?.status === 'APPROVED' || captureRes?.status === 'APPROVED')) ||
                captureRes?.status === 'APPROVED' || captureRes?.data?.status === 'APPROVED'
              ) {
                this.mensagem = 'Pagamento efetuado com sucesso!';
              } else if (captureRes?.success === false && captureRes?.error) {
                this.mensagem = 'Falha na captura: ' + (captureRes?.error?.message || captureRes?.error);
              } else {
                const status = captureRes?.data?.status || captureRes?.status || 'Desconhecido';
                if (status === 'AUTHORIZED') {
                  this.mensagem = 'Pagamento efetuado com sucesso!';
                } else {
                  this.mensagem = 'Status da captura: ' + status;
                }
              }
              this.carregando = false;
            },
            error: (err) => {
              if (
                err?.error?.error?.message?.includes('Limite insuficiente') ||
                (err?.error?.error && typeof err?.error?.error === 'string' && err?.error?.error.includes('Limite insuficiente'))
              ) {
                this.mensagem = 'Pagamento negado! Limite insuficiente.';
                this.erro = null;
              } else if (
                err?.error?.error?.message?.includes('Cartão não encontrado') ||
                (err?.error?.error && typeof err?.error?.error === 'string' && err?.error?.error.includes('Cartão não encontrado'))
              ) {
                this.mensagem = 'Pagamento negado! Cartão inválido.';
                this.erro = null;
              } else {
                this.erro = 'Erro ao capturar pagamento: ' + (err?.message || String(err));
              }
              this.carregando = false;
            }
          });
        } else {
          this.erro = 'Intent criado, mas id não encontrado.';
          this.carregando = false;
        }
      },
      error: (err) => {
        this.erro = 'Erro ao criar intent: ' + (err?.message || String(err));
        this.carregando = false;
      }
    });
  }
}
