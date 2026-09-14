const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const strokeSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      index: true,
    },
    strokeId: {
      type: String,
      required: true,
    },
    authorSocketId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      maxlength: 60,
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
      max: 40,
    },
    tool: {
      type: String,
      enum: ['pen', 'eraser'],
      default: 'pen',
    },
    // Capped so a single malicious/buggy client can't write an unbounded document
    points: {
      type: [pointSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0 && v.length <= 5000,
    },
  },
  { timestamps: true }
);

strokeSchema.index({ boardId: 1, createdAt: 1 });

module.exports = mongoose.model('Stroke', strokeSchema);
