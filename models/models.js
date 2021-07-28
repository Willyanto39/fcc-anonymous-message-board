const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  reported: {
    type: Boolean,
    default: false
  },
  delete_password: String
});

const threadSchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: {
    type: Boolean,
    default: false
  },
  delete_password: String,
  replies: [replySchema]
});

const boardSchema = new mongoose.Schema({
  name: String,
  threads: [threadSchema]
});

const Reply = mongoose.model('Reply', replySchema);
const Thread = mongoose.model('Thread', threadSchema);
const Board = mongoose.model('Board', boardSchema);

module.exports = {
  Reply,
  Thread,
  Board
};
