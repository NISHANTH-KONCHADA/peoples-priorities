import express from 'express';
import { Submission } from '../models/Submission';
import { analyzeSubmission } from '../services/groqService';

export const submissionRoutes = express.Router();

submissionRoutes.post('/', async (req, res) => {
  try {
    const { citizenId, category, text, language, wardNumber, geolocation, photoUrl } = req.body;

    // 1. Analyze with AI
    const analysis = await analyzeSubmission(text, language);

    // 2. Save to DB
    const newSubmission = new Submission({
      citizenId: citizenId || `cit-${Date.now()}`, // fallback to random if not provided
      category,
      originalText: text,
      translatedText: analysis.translatedText,
      language,
      wardNumber,
      geolocation,
      photoUrl,
      aiExtractedTheme: analysis.theme,
      aiUrgencyScore: analysis.urgency,
      status: 'Pending'
    });

    await newSubmission.save();

    // 3. Emit via Socket.io (we'll attach io to req later in index.ts)
    if (req.app.get('io')) {
      req.app.get('io').emit('new_submission', newSubmission);
    }

    res.status(201).json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to process submission' });
  }
});
