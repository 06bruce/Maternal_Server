const axios = require('axios');

const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
const CHATBASE_BOT_ID = process.env.CHATBASE_BOT_ID;

/**
 * Generate AI-powered pregnancy week information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWeekInfo = async (req, res) => {
  try {
    const { week, language = 'en' } = req.query;

    if (!week || week < 1 || week > 42) {
      return res.status(400).json({ 
        success: false,
        error: "Valid week number (1-42) is required" 
      });
    }

    if (!CHATBASE_BOT_ID || !CHATBASE_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: "Chatbase credentials not set" 
      });
    }

    // Create a detailed prompt for the AI
    const languageInstruction = language === 'rw' 
      ? 'Respond ONLY in Kinyarwanda language.' 
      : language === 'fr'
      ? 'Respond ONLY in French language.'
      : 'Respond ONLY in English language.';

    const prompt = `You are a maternal health expert. Provide detailed information for week ${week} of pregnancy. ${languageInstruction}

IMPORTANT: Return ONLY a valid JSON object with NO additional text, NO markdown, NO code blocks.

Provide:
1. babyDevelopment: Baby's size (in cm and grams), weight, and 2-3 key developmental milestones happening this week
2. motherExperience: 3-4 common symptoms and physical/emotional changes the mother experiences this week
3. weeklyTips: 4-5 specific, actionable tips (nutrition, exercise, warning signs, doctor visits)

Return ONLY this JSON structure:
{
  "babyDevelopment": "detailed text here",
  "motherExperience": "detailed text here", 
  "weeklyTips": "detailed text here"
}`;

    const payload = {
      messages: [
        {
          content: prompt,
          role: "user"
        }
      ],
      chatbotId: CHATBASE_BOT_ID,
      stream: false,
      temperature: 0.7
    };

    const response = await axios.post("https://www.chatbase.co/api/v1/chat", payload, {
      headers: {
        Authorization: `Bearer ${CHATBASE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const aiText = response.data?.text || response.data?.message;

    if (!aiText) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON from AI response
    let parsedInfo;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText;
      parsedInfo = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, structure the text response
      parsedInfo = {
        babyDevelopment: aiText.split('\n')[0] || 'Information not available',
        motherExperience: aiText.split('\n')[1] || 'Information not available',
        weeklyTips: aiText.split('\n')[2] || 'Information not available'
      };
    }

    return res.json({
      success: true,
      week: parseInt(week),
      language,
      info: {
        babyDevelopment: parsedInfo.babyDevelopment || parsedInfo.baby || 'Information not available',
        motherExperience: parsedInfo.motherExperience || parsedInfo.mother || 'Information not available',
        weeklyTips: parsedInfo.weeklyTips || parsedInfo.tips || 'Information not available'
      },
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("Pregnancy info generation error:", err.response?.data || err.message);
    
    return res.status(500).json({
      success: false,
      error: "Failed to generate pregnancy information",
      details: err.response?.data || err.message
    });
  }
};

module.exports = {
  getWeekInfo
};
