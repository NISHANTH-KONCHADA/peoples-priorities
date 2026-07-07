import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string; // Storing plain text or simple hash just for hackathon MVP, but let's assume it's hashed
  role: 'admin';
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
