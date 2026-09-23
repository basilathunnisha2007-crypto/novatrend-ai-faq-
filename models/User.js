// models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = {
  PUBLIC: 'public',
  CUSTOMER: 'customer',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

export const LOGIN_ROLES = [ROLES.CUSTOMER, ROLES.MANAGER, ROLES.ADMIN];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: LOGIN_ROLES, default: ROLES.CUSTOMER }
  },
  { timestamps: true }
);

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compareSync(String(password), this.passwordHash);
};

userSchema.methods.toPublic = function toPublic() {
  return { id: this._id.toString(), name: this.name, email: this.email, role: this.role };
};

userSchema.statics.hashPassword = (password) => bcrypt.hashSync(String(password), 10);

export const User = mongoose.model('User', userSchema);
