import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Ward } from './models/Ward';
import { ProposedProject } from './models/ProposedProject';
import { User } from './models/User';
import { Submission } from './models/Submission';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Ward.deleteMany({});
    await ProposedProject.deleteMany({});
    await User.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Seed Wards
    const wards = await Ward.insertMany([
      {
        wardNumber: 1, name: 'Downtown Commercial', population: 45000, literacyRate: 92, avgHouseholdIncome: 85000,
        existingInfrastructure: { schoolsCount: 5, phcsCount: 2, roadConditionScore: 8 },
        snapshotData: { enrollmentTrend: 2, nearestAlternateSchoolDist: 1.5, nearestHospitalDist: 2, waterSupplyHoursPerDay: 22 }
      },
      {
        wardNumber: 4, name: 'West End', population: 30000, literacyRate: 85, avgHouseholdIncome: 55000,
        existingInfrastructure: { schoolsCount: 3, phcsCount: 1, roadConditionScore: 6 },
        snapshotData: { enrollmentTrend: 5, nearestAlternateSchoolDist: 4.0, nearestHospitalDist: 6, waterSupplyHoursPerDay: 18 }
      },
      {
        wardNumber: 7, name: 'East Residential', population: 62000, literacyRate: 81, avgHouseholdIncome: 42000,
        existingInfrastructure: { schoolsCount: 2, phcsCount: 1, roadConditionScore: 4 },
        snapshotData: { enrollmentTrend: 18, nearestAlternateSchoolDist: 6.0, nearestHospitalDist: 8, waterSupplyHoursPerDay: 12 }
      },
      {
        wardNumber: 9, name: 'Old City Basin', population: 70000, literacyRate: 70, avgHouseholdIncome: 30000,
        existingInfrastructure: { schoolsCount: 4, phcsCount: 1, roadConditionScore: 3 },
        snapshotData: { enrollmentTrend: 10, nearestAlternateSchoolDist: 3.0, nearestHospitalDist: 7, waterSupplyHoursPerDay: 6 }
      },
      {
        wardNumber: 12, name: 'Industrial Outskirts', population: 38000, literacyRate: 75, avgHouseholdIncome: 35000,
        existingInfrastructure: { schoolsCount: 1, phcsCount: 1, roadConditionScore: 3 },
        snapshotData: { enrollmentTrend: 5, nearestAlternateSchoolDist: 10.0, nearestHospitalDist: 12, waterSupplyHoursPerDay: 8 }
      },
      {
        wardNumber: 15, name: 'North Hills', population: 25000, literacyRate: 88, avgHouseholdIncome: 60000,
        existingInfrastructure: { schoolsCount: 3, phcsCount: 1, roadConditionScore: 7 },
        snapshotData: { enrollmentTrend: -2, nearestAlternateSchoolDist: 3.5, nearestHospitalDist: 5, waterSupplyHoursPerDay: 20 }
      },
      {
        wardNumber: 22, name: 'South Farms', population: 50000, literacyRate: 68, avgHouseholdIncome: 28000,
        existingInfrastructure: { schoolsCount: 2, phcsCount: 0, roadConditionScore: 5 },
        snapshotData: { enrollmentTrend: 10, nearestAlternateSchoolDist: 8.5, nearestHospitalDist: 15, waterSupplyHoursPerDay: 10 }
      }
    ]);
    console.log('Seeded Wards.');

    // 2. Seed Proposed Projects (Govt plans)
    await ProposedProject.insertMany([
      {
        projectName: 'Ward 7 Vocational Training Centre',
        wardNumber: 7,
        category: 'Employment & Skilling',
        estimatedCost: 15000000,
        status: 'Proposed',
        description: 'A new vocational training centre for youth skilling in Ward 7.'
      },
      {
        projectName: 'Downtown Smart Streetlights',
        wardNumber: 1,
        category: 'Electricity',
        estimatedCost: 5000000,
        status: 'Approved',
        description: 'Upgrading streetlights to LED in the commercial district.'
      },
      {
        projectName: 'Ward 12 Primary Health Centre Upgrade',
        wardNumber: 12,
        category: 'Health',
        estimatedCost: 8000000,
        status: 'Proposed',
        description: 'Adding 20 beds and a new maternity ward to the existing PHC.'
      },
      {
        projectName: 'South Farms Canal Restoration',
        wardNumber: 22,
        category: 'Water & Sanitation',
        estimatedCost: 25000000,
        status: 'Proposed',
        description: 'Restoring the main irrigation canal.'
      },
      {
        projectName: 'Ward 15 Tech Park Initiative',
        wardNumber: 15,
        category: 'Employment & Skilling',
        estimatedCost: 45000000,
        status: 'Proposed',
        description: 'Creating a modern tech incubation hub for startups.'
      },
      {
        projectName: 'Ward 9 Heritage Beautification',
        wardNumber: 9,
        category: 'Other',
        estimatedCost: 12000000,
        status: 'Proposed',
        description: 'Installing statues and fountains in the old city square.'
      }
    ]);
    console.log('Seeded Proposed Projects.');

    // 3. Seed Admin User
    await User.create({
      username: 'admin',
      passwordHash: 'admin123',
      role: 'admin'
    });
    console.log('Seeded Admin User.');

    // 4. Seed Submissions (Massive Diverse Data)
    const seedSubmissions = [];
    
    // Helper to generate dates over the past 30 days
    const randomDate = (daysAgoStart = 30, daysAgoEnd = 0) => {
      const now = Date.now();
      const offsetStart = daysAgoStart * 24 * 60 * 60 * 1000;
      const offsetEnd = daysAgoEnd * 24 * 60 * 60 * 1000;
      return new Date(now - offsetEnd - Math.random() * (offsetStart - offsetEnd));
    };

    // A. CLASH SCENARIO 1: Ward 7 wants Schools, but Govt proposed Vocational Centre
    const themesWard7Schools = ['School Infrastructure', 'Primary School Capacity', 'School Transport'];
    for (let i = 0; i < 65; i++) {
      seedSubmissions.push({
        citizenId: `cit-w7-${i}`,
        category: 'Education',
        originalText: 'The local primary schools are overflowing. We need better school infrastructure for kids under 10, not just for adults.',
        translatedText: 'The local primary schools are overflowing. We need better school infrastructure for kids under 10, not just for adults.',
        language: 'English',
        wardNumber: 7,
        geolocation: { lat: 28.61 + (Math.random() * 0.02 - 0.01), lng: 77.20 + (Math.random() * 0.02 - 0.01) },
        aiExtractedTheme: themesWard7Schools[i % themesWard7Schools.length],
        aiUrgencyScore: 4 + (i % 2),
        status: 'Pending',
        timestamp: randomDate(30, 0)
      });
    }

    // B. CLASH SCENARIO 2: Ward 9 needs Drainage (huge spike last week), Govt proposed Beautification
    for (let i = 0; i < 40; i++) {
      seedSubmissions.push({
        citizenId: `cit-w9-drain-${i}`,
        category: 'Water & Sanitation',
        originalText: 'Clogged drains are flooding the streets every time it rains! It is a massive health hazard.',
        translatedText: 'Clogged drains are flooding the streets every time it rains! It is a massive health hazard.',
        language: 'English',
        wardNumber: 9,
        geolocation: { lat: 28.65, lng: 77.23 },
        aiExtractedTheme: 'Drainage Overflows',
        aiUrgencyScore: 5,
        status: 'Pending',
        timestamp: randomDate(7, 0)
      });
    }

    // C. WARD 4 Potholes (Fixed last month, so very few recent complaints, good for digest)
    for (let i = 0; i < 25; i++) {
      seedSubmissions.push({
        citizenId: `cit-w4-road-${i}`,
        category: 'Roads & Infrastructure',
        originalText: 'Roads are terribly broken.',
        translatedText: 'Roads are terribly broken.',
        language: 'English',
        wardNumber: 4,
        geolocation: { lat: 28.60, lng: 77.18 },
        aiExtractedTheme: 'Potholes',
        aiUrgencyScore: 3,
        status: 'Pending',
        timestamp: randomDate(30, 20)
      });
    }

    // D. Ward 22 Hindi/Tamil Submissions (Water Shortage)
    for (let i = 0; i < 35; i++) {
      seedSubmissions.push({
        citizenId: `cit-w22-wat-${i}`,
        category: 'Water & Sanitation',
        originalText: i % 2 === 0 ? 'पानी की बहुत किल्लत है, नहर सूखी है।' : 'குடிநீர் தட்டுப்பாடு அதிகமாக உள்ளது.',
        translatedText: 'There is a severe water shortage, the canal is dry.',
        language: i % 2 === 0 ? 'Hindi' : 'Tamil',
        wardNumber: 22,
        geolocation: { lat: 28.59, lng: 77.19 },
        aiExtractedTheme: 'Canal Dryness / Water Shortage',
        aiUrgencyScore: 5,
        status: 'Pending',
        timestamp: randomDate(25, 0)
      });
    }

    // E. General noise across various wards
    const noiseData = [
      { ward: 1, cat: 'Public Safety', text: 'Need more street lighting near the downtown transit station.', theme: 'Transit Safety' },
      { ward: 15, cat: 'Electricity', text: 'Power cuts are frequent during evening hours.', theme: 'Evening Power Cuts' },
      { ward: 12, cat: 'Health', text: 'Hospital queue is too long, need more doctors.', theme: 'Hospital Staffing' }
    ];

    noiseData.forEach(nd => {
      for (let i = 0; i < 15; i++) {
        seedSubmissions.push({
          citizenId: `cit-noise-${nd.ward}-${i}`,
          category: nd.cat,
          originalText: nd.text,
          translatedText: nd.text,
          language: 'English',
          wardNumber: nd.ward,
          geolocation: { lat: 28.6, lng: 77.2 },
          aiExtractedTheme: nd.theme,
          aiUrgencyScore: 3,
          status: 'Pending',
          timestamp: randomDate(30, 0)
        });
      }
    });

    await Submission.insertMany(seedSubmissions);
    console.log(`Seeded ${seedSubmissions.length} Submissions.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
