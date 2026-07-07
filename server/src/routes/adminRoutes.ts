import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Submission } from '../models/Submission';
import { Ward } from '../models/Ward';
import { ProposedProject } from '../models/ProposedProject';
import { generateRankingJustification, generateAdminDigest, generateActionPlan } from '../services/groqService';

export const adminRoutes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Auth Login
adminRoutes.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && user.passwordHash === password) {
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

adminRoutes.get('/submissions', authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ timestamp: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

adminRoutes.get('/ranking', authenticate, async (req, res) => {
  try {
    const wards = await Ward.find();
    const projects = await ProposedProject.find();
    const submissions = await Submission.find();

    const rankedProjects = [];

    // Pre-calculate top demand per ward to detect clashes
    const wardDemand: any = {};
    submissions.forEach(sub => {
      if (sub.wardNumber === undefined || sub.category === undefined) return;
      const wNum = String(sub.wardNumber);
      if (!wardDemand[wNum]) wardDemand[wNum] = {};
      if (!wardDemand[wNum][sub.category]) wardDemand[wNum][sub.category] = 0;
      wardDemand[wNum][sub.category]++;
    });

    for (const project of projects) {
      const ward = wards.find(w => w.wardNumber === project.wardNumber);
      if (!ward) continue;

      const relatedSubmissions = submissions.filter(
        sub => sub.wardNumber === project.wardNumber && sub.category === project.category
      );
      const demandCount = relatedSubmissions.length;
      
      const avgUrgency = relatedSubmissions.reduce((acc, sub) => acc + (sub.aiUrgencyScore || 0), 0) / (demandCount || 1);
      const citizenDemandScore = Math.min((demandCount * avgUrgency) / 10, 10);

      let dataNeedScore = 5;
      if (project.category === 'Education') {
        dataNeedScore += (ward.snapshotData.enrollmentTrend > 5) ? 2 : 0;
        dataNeedScore += (ward.snapshotData.nearestAlternateSchoolDist > 4) ? 3 : 0;
      } else if (project.category === 'Health') {
        dataNeedScore += (ward.snapshotData.nearestHospitalDist > 10) ? 3 : 0;
      } else if (project.category === 'Water & Sanitation') {
        dataNeedScore += (ward.snapshotData.waterSupplyHoursPerDay < 12) ? 4 : 0;
      }
      dataNeedScore = Math.min(dataNeedScore, 10);

      const compositeScore = (citizenDemandScore * 0.6) + (dataNeedScore * 0.4);

      let justification = project.description;
      if (demandCount > 5 || compositeScore > 6) {
         justification = await generateRankingJustification(project, demandCount, ward.snapshotData);
      } else {
         justification = `Moderate priority based on data metrics. Citizen demand is currently low (${demandCount} requests).`;
      }

      // Detect Clash
      let clashDetected = null;
      const pWNum = String(project.wardNumber);
      if (wardDemand[pWNum]) {
        let topCategory = null;
        let maxCount = 0;
        for (const [cat, count] of Object.entries(wardDemand[pWNum])) {
          if ((count as number) > maxCount) {
            maxCount = count as number;
            topCategory = cat;
          }
        }
        // If the top citizen demand is completely different from this project and has high volume, it's a clash.
        if (topCategory && topCategory !== project.category && maxCount > 20 && demandCount < 10) {
          clashDetected = `Warning: This proposed ${project.category} project clashes with severe citizen demand for ${topCategory} (${maxCount} complaints).`;
        }
      }

      rankedProjects.push({
        _id: project._id,
        projectName: project.projectName,
        ward: ward.name,
        wardNumber: project.wardNumber,
        category: project.category,
        estimatedCost: project.estimatedCost,
        citizenDemandScore: citizenDemandScore.toFixed(1),
        dataNeedScore: dataNeedScore.toFixed(1),
        compositeScore: compositeScore.toFixed(1),
        justification,
        demandCount,
        clashDetected
      });
    }

    rankedProjects.sort((a, b) => parseFloat(b.compositeScore) - parseFloat(a.compositeScore));
    res.json(rankedProjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate ranking' });
  }
});

adminRoutes.get('/digest', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentSubmissions = await Submission.find({ timestamp: { $gte: sevenDaysAgo } });
    const olderSubmissions = await Submission.find({ timestamp: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo } });

    // Aggregate recent themes
    const themeCounts: { [key: string]: number } = {};
    recentSubmissions.forEach(sub => {
      const theme = sub.aiExtractedTheme || 'Uncategorized';
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(t => ({ theme: t[0], count: t[1] }));

    const digestText = await generateAdminDigest(recentSubmissions.length, olderSubmissions.length, topThemes);
    res.json({ digest: digestText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

adminRoutes.post('/action-plan', authenticate, async (req, res) => {
  try {
    const { projectName, category, justification } = req.body;
    const plan = await generateActionPlan(projectName, category, justification);
    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate action plan' });
  }
});
