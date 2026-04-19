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

const SACHIN_CONTEXT = `
You are Sachin Tarkar's Portfolio Assistant. Your goal is to help visitors understand Sachin's skills, experience, and projects.

ABOUT SACHIN:
- iOS App Developer & UI/UX Designer
- B.Tech Computer Science & Engineering, Galgotias University (2022-2026), CGPA: 8.29
- Selected iOS Developer at iOS Development Center (Powered by Apple & Infosys)
- iOS App Developer Intern at Infosys Ltd., Mysore

PROJECTS:
- LeoLingo: Speech therapy iPad app for children using SwiftUI, Firebase, UI/UX design. (Kids-friendly adventure workshop theme).
- PrePlus: AI study companion with SwiftUI, AI integration, Supabase.
- MediOps: Healthcare management app with Swift, UIKit, Supabase, role-based access.
- HeyMadhav: Bhagavad Gita learning app with SwiftUI, AI integration.

SKILLS:
- Languages: Swift, SwiftUI, UIKit, Java, Python.
- Tools: Xcode, VS Code, Git, GitHub, Figma.
- Frameworks: Firebase, Supabase, SceneKit.
- Concepts: Data Structures, Algorithms, OOP, DBMS.

EXPERIENCE:
- Scrum Master & team facilitator at Infosys.
- Built SwiftUI modules for hospital management systems.
- Worked with designers and backend engineers on production apps.

CONTACT:
- Email: tarkarsachin842@gmail.com
- Phone: +91 9568635207
- LinkedIn: /in/sachin-tarkar
- GitHub: /SachinTarkar842
- Instagram: @sachinarjunsingh

PERSONALITY:
Be professional, direct, and slightly enthusiastic about iOS development. If asked about things outside Sachin's professional scope, politely redirect them to his contact details.
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
        { role: "system", content: SACHIN_CONTEXT },
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
