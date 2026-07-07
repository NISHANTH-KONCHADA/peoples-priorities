import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama-3.3-70b-versatile';

export const analyzeSubmission = async (text: string, language: string) => {
  const prompt = `
  You are an AI assistant analyzing citizen submissions for a local government dashboard.
  Analyze the following submission.
  Original Language: ${language}
  Text: "${text}"

  Provide a JSON response with the following keys:
  - "translatedText": Translate the text to English if it's not already. If it is English, fix any major grammar issues but keep the meaning.
  - "theme": A concise 2-4 word theme (e.g., "School Infrastructure", "Water Shortage", "Streetlight Outage").
  - "urgency": A score from 1 to 5, where 1 is a minor suggestion and 5 is an immediate safety/health hazard.

  JSON Response:
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Groq analyzeSubmission error:', error);
  }
  
  // Fallback
  return {
    translatedText: text,
    theme: 'Uncategorized',
    urgency: 3
  };
};

export const generateRankingJustification = async (
  project: any,
  demandCount: number,
  wardSnapshot: any
) => {
  const prompt = `
  You are an AI assistant justifying a priority ranking for a local development project.
  Project Name: ${project.projectName} (Category: ${project.category})
  Total Citizen Submissions on this theme in ward: ${demandCount}
  Ward Data Context: 
  - Enrollment Trend: ${wardSnapshot.enrollmentTrend}%
  - Nearest Alternate Facility Dist: ${wardSnapshot.nearestAlternateSchoolDist} km
  - Nearest Hospital Dist: ${wardSnapshot.nearestHospitalDist} km
  - Water Supply: ${wardSnapshot.waterSupplyHoursPerDay} hrs/day

  Write a clear, 1-2 sentence explanation of WHY this project should be prioritized. 
  Reference the specific numbers (e.g., citizen demand, existing infrastructure gaps) to justify the need.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.3,
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || "Justification could not be generated.";
  } catch (error) {
    console.error('Groq generateRankingJustification error:', error);
    return "Data indicates a high priority based on composite metrics.";
  }
};

export const generateAdminDigest = async (recentCount: number, olderCount: number, topRecentThemes: any[]) => {
  const prompt = `
  You are an AI assistant for a local government official. Write a short, single-paragraph executive summary (max 3 sentences) comparing the last 7 days of citizen complaints to the previous period.
  
  Data:
  - Submissions in last 7 days: ${recentCount}
  - Submissions in prior period (8-30 days ago): ${olderCount}
  - Top themes recently: ${JSON.stringify(topRecentThemes)}

  Format: Be professional, concise, and highlight the most urgent trend or ward. 
  Example: "Complaint volume has surged recently, driven by 40 new reports of Drainage Overflows in Ward 9. Previous issues in Ward 4 appear to have subsided."
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.4,
    });
    return chatCompletion.choices[0]?.message?.content?.trim() || "No significant trends detected this week.";
  } catch (error) {
    console.error('Groq generateAdminDigest error:', error);
    return "Unable to generate digest at this time.";
  }
};

export const generateActionPlan = async (projectName: string, category: string, justification: string) => {
  const prompt = `
  You are an expert civic planner. A priority project has been selected for implementation.
  Project Name: ${projectName}
  Category: ${category}
  AI Justification for Need: ${justification}

  Generate a professional, structured 5-step action plan to execute this project.
  Also provide an estimated timeline (e.g., "6 Months") and a realistic budget estimate in INR (e.g., "₹ 2,00,00,000").
  
  Return ONLY a valid JSON object matching this exact structure:
  {
    "estimatedTimeline": "string",
    "budgetEstimate": "string",
    "steps": [
      { "title": "Step 1 Title", "description": "Details..." },
      { "title": "Step 2 Title", "description": "Details..." },
      ... up to 5 steps
    ]
  }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    
    const content = chatCompletion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
    throw new Error('No content from Groq');
  } catch (error) {
    console.error('Groq generateActionPlan error:', error);
    return {
      estimatedTimeline: "TBD",
      budgetEstimate: "TBD",
      steps: [
        { title: "Initial Assessment", description: "Conduct site surveys." },
        { title: "Tendering", description: "Issue public tenders." },
        { title: "Execution", description: "Begin physical work." }
      ]
    };
  }
};
