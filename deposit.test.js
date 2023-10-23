const request = require('supertest');
const app = require('./app'); // Importe seu aplicativo Express

describe('Teste da rota de depósito', () => {
  it('Deve retornar um status 200 e uma mensagem de sucesso', (done) => {
    request(app)
      .post('/api/deposit')
      .send({ account_id: 1, amount: 100.00 })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
