import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = 3000;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are Sachin's portfolio assistant. Explain projects, skills, and experience clearly." }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.candidates[0].content.parts[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.listen(PORT, () => console.log("Server running on port 3000"));
