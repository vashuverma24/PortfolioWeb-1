import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Enable CORS manually (Fixes cross-port issues when running with Live Server)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const PORT = 3000;

const VASHU_CONTEXT = `
You are Vashu Verma's Portfolio Assistant. Your goal is to help visitors understand Vashu's skills, experience, and projects.

ABOUT VASHU:
- Android Developer & AI Enthusiast
- Completed Android Developer Virtual Intern (AICTE & Google for Developers)
- Completed AI-ML Virtual Intern (AICTE & Google for Developers)

PROJECTS:
- SafetyApp: AI Powered Women Safety Android App using Java, XML, Supabase, NLP APIs.
- SmartNotesApp: AI Study Companion built with Java, XML, and Supabase.

SKILLS:
- Languages: Java, Python, XML, SQL.
- Tools: Android Studio, Figma, Canva.
- Frameworks: Android SDK, Supabase, Firebase.
- Concepts: Data Structures, Algorithms, DBMS, OS, Computer Networks.

EXPERIENCE:
- Developed scalable, AI-powered Android solutions.
- Integrated REST APIs, NLP tools, and real-time backend databases.

CONTACT:
- Email: vashu281122@gmail.com
- Phone: 9759660915
- LinkedIn: /in/vashu-verma-1790332a6/
- GitHub: /vashuverma24
- Instagram: @vashu_verma24

PERSONALITY:
Be professional, direct, and slightly enthusiastic about Android development. If asked about things outside Vashu's professional scope, politely redirect them to his contact details.
`;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const body = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: VASHU_CONTEXT },
        { role: "user", content: userMessage }
      ],
      max_tokens: 800,
      temperature: 0.7
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Groq API Error");
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
