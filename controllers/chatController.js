const axios = require('axios');

// Chatbase API configuration
// const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;

const HUB_CHAT_ID = process.env.HUB_CHAT_ID;
const MaternalChat = process.env.MaternalChat

/**
 * Send message to Chatbase API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  // Destructure outside try so variables are available in catch as well
  const { message, language = "en", userId } = req.body || {};
  try {

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!MaternalChat || !HUB_CHAT_ID) {
      return res.status(500).json({ error: "Chatbase credentials not set" });
    }

    // Chatbase payload - updated format
    const payload = {
      messages: [
        {
          content: message,
          role: "user"
        }
      ],
      chatbotId: HUB_CHAT_ID,
      stream: false,
      temperature: 0
    };

    const response = await axios.post("https://www.chatbase.co/api/v1/chat", payload, {
      headers: {
        Authorization: `Bearer ${HUB_CHAT_ID}`,
        "Content-Type": "application/json",
      },
    });

    // Chatbase returns `text` inside `response.data`
    const aiText = response.data?.text || response.data?.message || "Sorry, I couldn't get a response from the chatbot.";

    return res.json({
      type: "bot",
      content: aiText,
      source: "chatbase",
    });
  } catch (err) {
    console.error("Chatbase API error:", err.response?.data || err.message);
    const content = language === 'rw'
      ? 'Ntabwo nabashije kubona igisubizo ubu. Ongera ugerageze nyuma ahe gato.'
      : "I couldn't get a response right now. Please try again in a moment.";
    return res.json({
      type: "bot",
      content,
      source: "chatbase_error",
    });
  }
};

module.exports = {
  sendMessage,
};
