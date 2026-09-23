// models/History.js
// One document per chat turn. Authenticated turns carry a userId, public
// visitors are grouped by the browser-generated guestId.

import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestId: { type: String, default: null },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    generator: { type: String, default: 'knowledge-base' }
  },
  { timestamps: true }
);

historySchema.index({ userId: 1, createdAt: -1 });
historySchema.index({ guestId: 1, createdAt: -1 });

historySchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    question: this.question,
    answer: this.answer,
    generator: this.generator,
    createdAt: this.createdAt
  };
};

export const History = mongoose.model('History', historySchema);
