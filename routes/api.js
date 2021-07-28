'use strict';

const bcrypt = require('bcrypt');

const { Board, Thread, Reply } = require('../models/models');

const getOrCreateBoard = async (board) => {
  const boardData = await Board.findOne({ name: board });

  if (!boardData) {
    return await Board.create({ name: board });
  }

  return boardData;
};

const formatReply = (reply) => {
  return {
    _id: reply._id,
    text: reply.text,
    created_on: reply.created_on
  };
};

const hashPassword = async (password) => {
  const SALT_ROUND = 10;
  return await bcrypt.hash(password, SALT_ROUND);
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
}

module.exports = (app) => {
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      const { board } = req.params;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json([]);
        }

        const threads = boardData.threads
          .sort((a, b) => {
            const dateA = new Date(a.bumped_on);
            const dateB = new Date(b.bumped_on);

            return dateB - dateA;
          })
          .slice(0, 10)
          .map(thread => {
            const replies = thread.replies.
              sort((a, b) => {
                const dateA = new Date(a.created_on);
                const dateB = new Date(b.created_on);
                return dateB - dateA;
              })
              .slice(0, 3)
              .map(reply => {
                return formatReply(reply);
              });

            const {
              _id,
              text,
              created_on,
              bumped_on
            } = thread;

            return {
              _id,
              text,
              created_on,
              bumped_on,
              replies,
              replycount: thread.replies.length
            };
          });

        return res.json(threads);
      } catch(err) {
        res.send(err.message);
      }
    })
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;

      try {
        const boardData = await getOrCreateBoard(board);
        const hashedPassword = await hashPassword(delete_password);
        const currentDate = Date.now();

        const newThread = new Thread({
          text,
          delete_password: hashedPassword,
          created_on: currentDate,
          bumped_on: currentDate
        });

        boardData.threads.push(newThread);
        await boardData.save();

        return res.json(newThread);
      } catch(err) {
        res.send(err.message);
      }
    })
    .put(async (req, res) => {
      const { board } = req.params;
      const { report_id } = req.body;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(report_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        thread.reported = true;
        await boardData.save();

        return res.send('success');
      } catch(err) {
        res.send(err.message);
      }
    })
    .delete(async (req, res) => {
      const { board } = req.params;
      const { thread_id, delete_password } = req.body;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        const match = await comparePassword(delete_password, thread.delete_password);

        if (match) {
          thread.remove();
          await boardData.save();

          return res.send('success');
        }

        return res.send('incorrect password');
      } catch(err) {
        res.send(err.message);
      }
    })

  app.route('/api/replies/:board')
    .get(async (req, res) => {
      const { board } = req.params;
      const { thread_id } = req.query;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        const replies = thread.replies.map(reply => {
          return formatReply(reply);
        });

        return res.json({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies
        });
      } catch(err) {
        res.send(err.message);
      }
    })
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password, thread_id } = req.body;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        const currentDate = Date.now();
        const hashedPassword = await hashPassword(delete_password);
        const newReply = new Reply({
          text,
          delete_password: hashedPassword,
          created_on: currentDate
        });

        thread.replies.push(newReply);
        thread.bumped_on = newReply.created_on;

        await boardData.save();

        return res.json(thread);
      } catch(err) {
        res.send(err.message);
      }
    })
    .put(async (req, res) => {
      const { board } = req.params;
      const { thread_id, reply_id } = req.body;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        const reply = thread.replies.id(reply_id);

        if (!reply) {
          return res.json({ error: 'reply not found' });
        }

        reply.reported = true;
        await boardData.save();

        return res.send('success');
      } catch(err) {
        res.send(err.message);
      }
    })
    .delete(async (req, res) => {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;

      try {
        const boardData = await Board.findOne({ name: board });

        if (!boardData) {
          return res.json({ error: 'board not found' });
        }

        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          return res.json({ error: 'thread not found' });
        }

        const reply = thread.replies.id(reply_id);

        if (!reply) {
          return res.json({ error: 'reply not found' });
        }

        const match = await comparePassword(delete_password, reply.delete_password);

        if (match) {
          reply.text = '[deleted]';
          await boardData.save();

          return res.send('success');
        }

        return res.send('incorrect password');
      } catch(err) {
        res.send(err.message);
      }
    })
};
