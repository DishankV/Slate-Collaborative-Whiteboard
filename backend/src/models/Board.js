const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    passwordHash: {
      type: String,
      default: null, // null = open board, anyone with the link can join
    },
    createdBy: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'Unknown',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Never leak the hash to clients
boardSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    boardId: this.boardId,
    name: this.name,
    hasPassword: Boolean(this.passwordHash),
    createdBy: this.createdBy,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Board', boardSchema);
