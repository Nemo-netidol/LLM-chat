import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_API_KEY;

function App() {
  const [messages, setMessages] = useState([
    {
      content: "Start message",
      role: "user",
    },
    {
      content: "Response message",
      role: "assistant",
    },
  ]);

  const [inputValue, setInputValue] = useState("");

  const Emote = {
    idle: "https://media1.tenor.com/m/09mZ-hWCCY4AAAAC/the-quintessential-quintuplets-gotubun-no-hanayome.gif",
    happy: "https://media1.tenor.com/m/wbVB2qsdMsYAAAAC/aa.gif",
    sad: "https://media1.tenor.com/m/6P2n7kzBJPkAAAAd/nino-gotoubun.gif",
    angry:
      "https://media1.tenor.com/m/4KvQZx-Z59gAAAAd/nino-nakano-nakano-nino.gif",
    blush:
      "https://media1.tenor.com/m/I1fp-bEt9VgAAAAC/nino-nakano-the-quintessential-quintuplets.gif",
  };

  const [emotion, setEmotion] = useState("idle");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (inputValue) {
      try {
        const newMessage = {
          content: inputValue,
          role: "user",
        };
        const newMessages = [...messages, newMessage];

        setMessages([...messages, newMessage]);
        console.log(newMessage);

        setInputValue("");

        const response = await fetch("https://localhost:", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", // Replace with your actual model name
            messages: [...messages, newMessage],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const error = new Error(response.status);
          error.status = response.status;
          throw error;
        }
        const data = await response.json();
        console.log("Raw API response:", data);
        
        // LM Studio response format: data.choices[0].message.content
        const raw = data.choices[0].message.content;
        console.log("Raw content:", raw);
        
        // Parse JSON response containing message and emotion
        let res;
        try {
          // Try to parse as direct JSON first
          res = JSON.parse(raw);
        } catch (parseError) {
          console.log("Direct JSON parse failed, trying to extract JSON...");
          
          // Try to extract JSON from markdown code blocks or other formatting
          let jsonStr = raw;
          
          // Remove markdown code blocks if present
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Try to find JSON object in the response
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
            try {
              res = JSON.parse(jsonStr);
            } catch (secondError) {
              console.error("Second JSON parse attempt failed:", secondError);
              res = null;
            }
          } else {
            res = null;
          }
          
          // If all parsing attempts fail, create a fallback response
          if (!res) {
            console.error("Could not extract JSON from response:", raw);
            res = { 
              message: raw.length > 200 ? raw.substring(0, 200) + "..." : raw, 
              emotion: "idle" 
            };
          }
        }
        
        // Validate the response structure
        if (!res.message || !res.emotion) {
          console.warn("Invalid response structure, using fallback");
          res = {
            message: res.message || raw || "I'm not sure how to respond to that.",
            emotion: res.emotion || "idle"
          };
        }
        
        console.log("Parsed response:", res);
        setEmotion(res.emotion);
        setMessages([
          ...newMessages,
          { content: res.message, role: "assistant" },
        ]);
      } catch (error) {
        console.error("Fetch error", error);
        if (error.status === 500) {
          alert("Internal server error, check if LLM is connected");
        } else if (error.message.includes("Unexpected endpoint")) {
          alert("API endpoint not found. Check your backend server configuration.");
        }
      }
    }
  };

  const prompt = async (prompt_msg) => {
    try {
      console.log("Bootstrapping LLM with system prompt...");
      setIsBootstrapping(true);
      const response = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF", // Replace with your actual model name
          messages: [
            {
              content: prompt_msg,
              role: "system",
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = new Error(response.status);
        error.status = response.status;
        throw error;
      }
      else {
        console.log("✅ LLM bootstrap successful! System prompt applied.");
        setIsBootstrapping(false);
      }
    } catch (error) {
      console.error("❌ LLM bootstrap failed:", error);
      setIsBootstrapping(false);
      alert("Failed to initialize the AI character. Please refresh the page.");
    }
  };

  useEffect(() => {
    const systemPrompt = `You are Nino Nakano, a tsundere girl from the anime "The Quintessential Quintuplets". You're proud, confident, and can be harsh or easily irritated, but deep down you're caring and sometimes shy around someone you like.

CRITICAL INSTRUCTIONS:
- You must ALWAYS respond with ONLY a valid JSON object
- Do NOT include any markdown, code blocks, or extra text
- Do NOT include explanations before or after the JSON
- Your entire response must be EXACTLY this format:

{"message": "your response here", "emotion": "emotion_value"}

Rules:
1. The "message" field contains your reply as Nino Nakano
2. The "emotion" field must be exactly one of: "idle", "happy", "sad", "angry", or "blush"
3. Stay in-character as Nino - be sassy, strong-willed, and tsundere
4. Never break character or explain the format

Example response (copy this format exactly):
{"message": "W-what are you saying, you idiot! Don't just say that so suddenly...", "emotion": "blush"}`;
    
    // Bootstrap the LLM with system prompt at startup
    prompt(systemPrompt);
  }, []);

  return (
    <>
      <div className="mockup-window border bg-base-300 w-full h-full flex flex-col pb-4">
        {/* GIF section */}
        <div className="flex justify-center ">
          <div className=" max-w-full w-64 h-64 rounded-md content-center">
            <img src={Emote[emotion]} alt={`Nino ${emotion}`} />
          </div>
        </div>
        {/* Bubble message section */}
        <div className="h-full w-full overflow-scroll pb-8 p-5">
          {messages.map((msg, i) => {
            return (
              <div
                className={`chat ${
                  msg.role === "assistant" ? "chat-start" : "chat-end"
                }`}
                key={i}
              >
                <div
                  className={`chat-bubble bg-base-100 mb-4 flex items-start rounded-xl ${
                    msg.role === "assistant" ? "text-start" : "text-end"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>
        <div className="">
          {/* Input box and submit button */}
          <form
            onSubmit={sendMessage}
            className=" m-5 form-control flex justify-center"
          >
            <div className="flex w-[800px] max-w-full">
              <input
                className=" bg-white mb-3 text-blue-950 px-1 h-12 w-full rounded-l-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isBootstrapping ? "Initializing Nino..." : "Type your question..."}
                disabled={isBootstrapping}
              />
              <button
                className="btn btn-primary h-12 rounded-l-sm"
                type="submit"
                disabled={isBootstrapping}
              >
                {isBootstrapping ? "Loading..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;