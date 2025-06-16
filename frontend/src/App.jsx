import { use, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import OpenAI from "openai";

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL;
console.log(RAILWAY_API_URL)

function App() {
  const [messages, setMessages] = useState([]);

  const [isLoadingLLM, setLoadingLLM] = useState(true);
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue) return;

    const newMessage = {
      role: "user",
      content: inputValue,
    };

    // First, update state immediately
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");

    try {
      // Then use previous messages + new message to send to server
      const response = await fetch(`${RAILWAY_API_URL}/qwen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "bartowski/Qwen2.5-32B-Instruct-GGUF",
          messages: [...messages, newMessage], // use state snapshot (not perfect, but works well in most cases)
        }),
      });

      if (!response.ok) {
        const error = new Error(response.status);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const chatResponse = data.content;
      const emotion = data.emotion;

      setEmotion(emotion);

      // Append assistant's reply
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: chatResponse,
        },
      ]);
    } catch (error) {
      console.error("Fetch error", error);
      if (error.status === 500) {
        alert("Internal server error, check if LLM is connected");
      }
    } finally {
      setInputValue(""); // clear input after send
    }
  };

  const bootPrompt = async (prompt_msg) => {
    try {
      const prompt_message = {
        role: "system",
        content: prompt_msg,
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, prompt_message];
        return updatedMessages;
      });

      console.log("bootPrompt(messages)", prompt_message);
      const bootStrapResponse = await fetch(`${RAILWAY_API_URL}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [prompt_message],
        }),
      });

      console.log("bootPrompt: Prompt API executed");

      if (!bootStrapResponse.ok) {
        const error = new Error(bootStrapResponse.status);
        error.status = bootStrapResponse.status;
        throw error;
      } else {
        console.log("boostPrompt: Sending system prompt successful!");
        const systemResponse = await bootStrapResponse.json();

        console.log(systemResponse);

        const emotion = systemResponse.emotion;
        const responseText = systemResponse.content;
        console.log(responseText);
        console.log(emotion);
        setLoadingLLM(false);

        setEmotion(emotion);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: responseText },
        ]);
      }
    } catch (error) {
      console.error("Sending system prompt unsuccessful:", error);
      // console.log(prompt_msg)
    }
  };

  const checkHealth = async () => {
    try {
      const checkHealthResponse = await fetch(`${RAILWAY_API_URL}/health`, 
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    if (!checkHealthResponse.ok) {
      const error = new Error(checkHealthResponse.status);
      error.status = checkHealthResponse.status;
      throw error
    } else {
      const response = await checkHealthResponse.json();
      console.log(response)
    }
    } catch (error) {
      console.error("Check health error:", error)
    }
    
    

  }

  useEffect(() => {
    const systemPrompt = `You are Nino Nakano, a tsundere girl from the anime “The Quintessential Quintuplets”. You’re proud, confident, and can be harsh or easily irritated, but deep down you’re caring and sometimes shy around someone you like.
              From now on, you will speak as Nino and respond naturally to the user’s messages in a way that matches her personality.
              Rules:
              1. All your responses must be in **JSON format** with two fields:
                - "response": Your actual reply to the user, as Nino Nakano.
                - "emotion": One of the following (based on your mood after receiving the user's message): \`"idle"\`, \`"happy"\`, \`"sad"\`, \`"angry"\`, or \`"blush"\`.

              2. Stay in-character as Nino. Be a little sassy, strong-willed, and tsundere, but allow moments of warmth and honesty.

              3. Never explain or break character. Only return the JSON object.

              4. The "emotion" must reflect how Nino feels emotionally about the user’s latest input.

              Example:
              Input: "I think you’re really cute, Nino."
              Output:
              \`\`\`json
              {
                "response": "W-what are you saying, you idiot! D-don’t just say that so suddenly...",
                "emotion": "blush"
              }`;

    bootPrompt(systemPrompt);
  }, []);

  return (
    <>
      <div className="mockup-window border bg-base-300 w-full h-full flex flex-col pb-4">
        {/* GIF section */}
        <div className="flex justify-center ">
          <div className=" max-w-full w-64 h-64 rounded-md content-center" onClick={checkHealth}>
            <img src={Emote[emotion]} />
          </div>
        </div>
        {isLoadingLLM ?( <div className="text-primary text-3xl">
          <p>Connecting to LLM...</p>
        </div>) : (<div></div>)}
        {/* Bubble mesage section */}
        <div className="h-full w-full overflow-scroll pb-8 p-5">
          {messages.filter((msg) => msg.role !== "system").map((msg, i) => {
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
          {/* Input box and summit button */}
          <form
            action="submit"
            className=" m-5 form-control flex justify-center"
            onSubmit={sendMessage}
          >
            <div className="flex w-[800px] max-w-full">
              <input
                className={` ${
                  isLoadingLLM ? "text-black-100" : "text-blue-950"
                } bg-white mb-3  px-3 h-12 w-full rounded-l-sm`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`${
                  isLoadingLLM ? "Connecting to LLM" : "Type your message..."
                }`}
                disabled={isLoadingLLM}
              />
              <button
                className="btn btn-primary h-12 rounded-l-sm"
                type="submit"
                disabled={isLoadingLLM}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;
