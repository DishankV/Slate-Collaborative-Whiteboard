const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      maxlength: 60,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
  },
  { timestamps: true }
);

messageSchema.index({ boardId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
