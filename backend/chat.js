import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from 'cors';

dotenv.config();

console.log(process.env.API_KEY)

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors()); 

const client = new OpenAI({
  apiKey: process.env.API_KEY,
});

app.get("/health", (req, res) => {
  console.log("Health check...")
  res.json({
    "health": "API is working"
  })
})

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;
    const role = req.body.role;
    console.log(message)
    console.log(role)

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: role,
          content: message,
        },
      ],
    });
    res.json({
       "content": completion.choices[0].message.content,
       "role": completion.choices[0].message.role
      });
      console.log(completion.choices[0].message.role)
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

    const response = await fetch("http://localhost:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "bartowski/Qwen2.5-32B-Instruct-GGUF",
          messages: [
            {
                role: "system",
                content: prompt_msg,
            },
          ],
        }),
      });

    const data = await response.json();
    // console.log(data.choices[0].message.content)
    const systemPromptResponse = data.choices[0].message.content;

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
