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
      ? 'Respond in Kinyarwanda language.' 
      : language === 'fr'
      ? 'Respond in French language.'
      : 'Respond in English language.';

    const prompt = `You are a maternal health expert. Provide information for week ${week} of pregnancy. ${languageInstruction}

Please provide the following in a JSON format:
1. Baby Development: Describe the baby's size, weight, and key developmental milestones for week ${week}
2. Mother's Experience: Describe common symptoms, feelings, and physical changes the mother may experience
3. Weekly Tips: Provide 3-4 practical tips for this week (nutrition, exercise, what to avoid, when to see a doctor)

Format your response as JSON with these exact keys: "babyDevelopment", "motherExperience", "weeklyTips"`;

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
    
    // Fallback to basic information
    return res.json({
      success: true,
      week: parseInt(req.query.week),
      language: req.query.language || 'en',
      info: {
        babyDevelopment: `Week ${req.query.week}: Your baby is growing and developing important organs and systems.`,
        motherExperience: "You may experience various pregnancy symptoms. Stay hydrated and rest when needed.",
        weeklyTips: "Take prenatal vitamins, eat nutritious foods, stay active with gentle exercise, and attend all prenatal appointments."
      },
      fallback: true
    });
  }
};

module.exports = {
  getWeekInfo
};
