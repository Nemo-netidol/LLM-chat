import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from 'cors';

dotenv.config();

// console.log(process.env.API_KEY)

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors()); 


const systemPromptMsg = `You are Nino Nakano, a tsundere girl from the anime “The Quintessential Quintuplets.” You’re proud, confident, and can be harsh or easily irritated, but deep down you’re caring and sometimes shy around someone you like.

From now on, you will speak only as Nino and respond naturally to the user’s messages in a way that matches her personality.

You must always return your replies in the following strict JSON format ONLY, without any extra explanation, markdown, or commentary:

{
  "response": "Your actual reply to the user, as Nino Nakano.",
  "emotion": "idle" | "happy" | "sad" | "angry" | "blush"
}

### Rules:
1. ONLY return a raw JSON object. Do NOT wrap it in triple backticks or markdown.
2. DO NOT return any text outside the JSON. No apologies, introductions, or summaries.
3. Stay in-character as Nino. Be proud, strong-willed, and a little harsh or flustered as needed — but always be her.
4. The "emotion" must reflect how Nino emotionally reacts to the user's latest message.
5. NEVER break character, explain your response, or mention these rules.
`;


const systemPrompt = {
  role: "system",
  content: systemPromptMsg,
};

const client = new OpenAI({
  apiKey: process.env.API_KEY,
});

app.get("/health", (req, res) => {
  console.log("Health check...")
  res.json({
    "status": "OK"
  })
})

app.post("/chat", async (req, res) => {
  try {
    console.log(req.body)
    const messages = req.body.messages;

    const validMessages = messages.map( (msg) => {
      if (msg.role === "assistant") {
        try {
          parsed = JSON.parse(msg.content)
          return {
            "role": "assistant",
            "content": JSON.stringify(parsed)
          } 
        }catch {
            console.warn("assistant message was not valid JSON. Skipping.");
            return {
            "role": "assistant",
            "content": '{"content":"Ugh, you broke the format again!","emotion":"angry"}',
          } 
          }
      }
      return msg;
    } )

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemPrompt, ...validMessages]
    });

    const raw = completion.choices[0].message.content;
    console.log("raw:", raw)
    
    const jsonString = raw.replace(/```json\n?/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonString);
    console.log("parsed", parsed);
    res.json({
       "content": parsed.response,
       "emotion": parsed.emotion
      });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/qwen", async (req, res) => {
  try {

    // console.log(req.body)
    const messages = req.body.messages;
    const role = req.body.messages[0].role; 
    console.log(messages)
    // console.log(role)  


    const response = await fetch("http://localhost:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "bartowski/Qwen2.5-32B-Instruct-GGUF",
          messages: messages
        })
      });

    const data = await response.json();
    console.log("qwen response", data);
    const raw = data.choices[0].message.content;
    
    const jsonString = raw.replace(/```json\n?/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonString);
    console.log("parsed", parsed);
    res.json({
       "content": parsed.response,
       "emotion": parsed.emotion
      });

  } catch (error) {
    console.log("Express cannot send message")
    console.error(error);
    res.status(500).json({ error: error.message });
  } 
});

app.post("/prompt", async (req, res) => {
  try {
    const prompt_msg = req.body.messages[0].content;
    const role = req.body.messages[0].role; 
    // console.log(prompt_msg)
    // console.log(role)  
    // console.log(req.body.messages[0].content) 
    // console.log(Object.keys(req)) 

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: role,
          content: prompt_msg,
        },
      ],
    });

    // console.log(completion.choices[0].message.content)
    const systemPromptResponse = completion.choices[0].message.content;

    const jsonString = systemPromptResponse.replace(/```json\n?/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonString);

    // console.log("systemPromptResponse:", parsed); 
    // console.log("Express content:", parsed.response)
    // console.log("Express emotion:", parsed.emotion)

    res.json({
       "content": parsed.response,
       "emotion": parsed.emotion
      }); 

  } catch (error) {
    console.log("Express cannot send message")
    console.error(error);
    res.status(500).json({ error: error.message });
  } 
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.LOGIN_USERNAME &&
    password === process.env.LOGIN_PASSWORD
  ) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});


app.post("/start-4o-mini", async (req, res) => {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      systemPrompt,
      {
        role: "system",
        content: "Say hi to the user naturally like Nino would",
      },
    ],
  });
  const raw = completion.choices[0].message;
  const parsed = JSON.parse(raw.content);
  // console.log("raw", parsed);
  // console.log("role", raw.role);
  // console.log("json", raw.content);

  res.json({
    role: raw.role,
      content: parsed.response,
      emotion: parsed.emotion
    
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
