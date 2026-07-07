import mongoose, { Schema, Document } from 'mongoose';

export interface IProposedProject extends Document {
  projectName: string;
  wardNumber: number;
  category: string;
  estimatedCost: number; // in INR or abstract units
  status: 'Proposed' | 'Approved' | 'In Progress' | 'Completed';
  description: string;
}

const ProposedProjectSchema: Schema = new Schema({
  projectName: { type: String, required: true },
  wardNumber: { type: Number, required: true },
  category: { type: String, required: true }, // 'Education', 'Health', etc.
  estimatedCost: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Proposed', 'Approved', 'In Progress', 'Completed'],
    default: 'Proposed'
  },
  description: { type: String, required: true }
}, { timestamps: true });

export const ProposedProject = mongoose.model<IProposedProject>('ProposedProject', ProposedProjectSchema);
