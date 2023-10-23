const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('./routes');
const expect = chai.expect;

chai.use(chaiHttp);


describe('API Routes', () => {
  it('deve depositar em uma conta', (done) => {
    chai
      .request(app)
      .post('/api/deposito')
      .send({ account_id: 1, amount: 100 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Depósito ecfetuado com sucesso');
        done();
      });
  });

  it('deve levantar em uma conta', (done) => {
    chai
      .request(app)
      .post('/api/levantamento')
      .send({ account_id: 1, amount: 50 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Levantamento ecfetuado com sucesso');
        done();
      });
  });

  it('deve permitir transferência entre as contas', (done) => {
    chai
      .request(app)
      .post('/api/transferencia')
      .send({ sender_account_id: 1, receiver_account_id: 2, amount: 30 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Transferência efetuada com sucesso');
        done();
      });
  });

  it('deve fazer o reembolso da transação', (done) => {
    chai
      .request(app)
      .post('/api/reembolso')
      .send({ original_transaction_id: 123, amount: 50 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Reembolso efetuado com sucesso');
        done();
      });
  });

  it('deve mostrar o saldo de uma conta', (done) => {
    chai
      .request(app)
      .get('/api/contas/1/saldo')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('deve mostrar as transações de uma conta', (done) => {
    chai
      .request(app)
      .get('/api/contas/1/transacoes')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});

