import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  citizenId: string;
  category: string;
  originalText: string;
  translatedText: string;
  language: string;
  wardNumber?: number;
  geolocation?: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  aiExtractedTheme?: string;
  aiUrgencyScore?: number; // 1 to 5
  status: 'Pending' | 'Actioned' | 'Under Review' | 'Deferred';
  aiRankingScore?: number; // Composite score calculated on the fly or stored
  aiJustification?: string;
  timestamp?: Date;
}

const SubmissionSchema: Schema = new Schema({
  citizenId: { type: String, required: true },
  category: { type: String, required: true },
  originalText: { type: String, required: true },
  translatedText: { type: String, required: true },
  language: { type: String, required: true },
  wardNumber: { type: Number },
  geolocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  photoUrl: { type: String },
  aiExtractedTheme: { type: String },
  aiUrgencyScore: { type: Number },
  status: { 
    type: String, 
    enum: ['Pending', 'Actioned', 'Under Review', 'Deferred'], 
    default: 'Pending' 
  },
  aiRankingScore: { type: Number },
  aiJustification: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
