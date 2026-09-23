// models/Faq.js

import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true }
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', answer: 'text', category: 'text' });

faqSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    question: this.question,
    answer: this.answer,
    category: this.category,
    updatedAt: this.updatedAt
  };
};

export const Faq = mongoose.model('Faq', faqSchema);
