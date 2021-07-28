const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId;
let replyId;

suite('Functional Tests', () => {
  suite('Test /api/threads/{board}', () => {
    test('Creating a New Thread', (done) => {
      chai
        .request(server)
        .post('/api/threads/test')
        .send({
          text: 'test create thread',
          delete_password: 'a'
        })
        .end((err, res) => {
          threadId = res.body._id;

          assert.equal(res.status, 200);
          assert.equal(res.body.text, 'test create thread');
          assert.equal(res.body.created_on, res.body.bumped_on);
          assert.isFalse(res.body.reported);
          assert.exists(res.body.delete_password);
          assert.isArray(res.body.replies);
          done();
        });
    });

    test('Viewing 10 Most Recent Threads With 3 Replies Each', (done) =>  {
      chai
        .request(server)
        .get('/api/threads/test')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isAtMost(res.body.length, 10);

          res.body.map(thread => {
            thread.replies.map(reply => {
              assert.notExists(reply.delete_password);
              assert.notExists(reply.reported);
            });

            assert.isAtMost(thread.replies.length, 3);
            assert.notExists(thread.delete_password);
            assert.notExists(thread.reported);
          });
          done();
        });
    });

    test('Deleting Thread With Incorrect Password', (done) => {
      chai
        .request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: threadId,
          delete_password: 'incorrect password'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        })
    });

    test('Deleting Thread With Correct Password', (done) => {
      chai
        .request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: threadId,
          delete_password: 'a'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a Thread', (done) => {
      chai
        .request(server)
        .put('/api/threads/test')
        .send({ report_id: '60fec7ed8d2df721fe888ef6' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  suite('Test /api/replies/{board}', () => {
    test('Creating a New Reply', (done) => {
      chai
        .request(server)
        .post('/api/replies/test')
        .send({
          text: 'test create reply',
          delete_password: 'a',
          thread_id: '60fec7ed8d2df721fe888ef6'
        })
        .end((err, res) => {
          const replies = res.body.replies;
          const lastReply = replies[replies.length - 1];
          replyId = lastReply._id;

          assert.equal(res.status, 200);
          assert.notEqual(res.body.bumped_on, res.body.created_on);
          assert.equal(lastReply.text, 'test create reply');
          assert.equal(lastReply.created_on, res.body.bumped_on);
          done();
        });
    });

    test('Viewing a Single Thread With All Replies', (done) => {
      chai
        .request(server)
        .get('/api/replies/test')
        .query({ thread_id: '60fec7ed8d2df721fe888ef6' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body.replies);
          assert.notExists(res.body.delete_password)
          assert.notExists(res.body.reported);

          res.body.replies.map(reply => {
            assert.notExists(reply.delete_password);
            assert.notExists(reply.reported);
          });
          done();
        });
    });

    test('Deleting Reply With Incorrect Password', (done) => {
      chai
        .request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: '60fec7ed8d2df721fe888ef6',
          reply_id: replyId,
          delete_password: 'incorrect password'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting Reply With Correct Password', (done) => {
      chai
        .request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: '60fec7ed8d2df721fe888ef6',
          reply_id: replyId,
          delete_password: 'a'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a Reply', (done) => {
      chai
        .request(server)
        .put('/api/replies/test')
        .send({
          thread_id: '60fec7ed8d2df721fe888ef6',
          reply_id: '60feceae05835227666a2a7e'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});
