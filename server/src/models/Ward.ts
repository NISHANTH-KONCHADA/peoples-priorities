import mongoose, { Schema, Document } from 'mongoose';

export interface IWard extends Document {
  wardNumber: number;
  name: string;
  population: number;
  literacyRate: number;
  avgHouseholdIncome: number;
  existingInfrastructure: {
    schoolsCount: number;
    phcsCount: number; // Primary Health Centres
    roadConditionScore: number; // 1-10
  };
  snapshotData: {
    enrollmentTrend: number; // e.g., % growth
    nearestAlternateSchoolDist: number; // in km
    nearestHospitalDist: number; // in km
    waterSupplyHoursPerDay: number;
  };
}

const WardSchema: Schema = new Schema({
  wardNumber: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  population: { type: Number, required: true },
  literacyRate: { type: Number, required: true },
  avgHouseholdIncome: { type: Number, required: true },
  existingInfrastructure: {
    schoolsCount: { type: Number, required: true },
    phcsCount: { type: Number, required: true },
    roadConditionScore: { type: Number, required: true },
  },
  snapshotData: {
    enrollmentTrend: { type: Number, required: true },
    nearestAlternateSchoolDist: { type: Number, required: true },
    nearestHospitalDist: { type: Number, required: true },
    waterSupplyHoursPerDay: { type: Number, required: true },
  }
}, { timestamps: true });

export const Ward = mongoose.model<IWard>('Ward', WardSchema);
