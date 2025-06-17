import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import OpenAI from "openai";
import Login from "./components/Login";

const API_URL = import.meta.env.VITE_RAILWAY_API_URL;
// const API_URL = "http://localhost:8080"
console.log(API_URL);

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoadingLLM, setLoadingLLM] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const Emote = {
    idle: "https://media1.tenor.com/m/09mZ-hWCCY4AAAAC/the-quintessential-quintuplets-gotubun-no-hanayome.gif",
    happy: "https://media1.tenor.com/m/wbVB2qsdMsYAAAAC/aa.gif",
    sad: "https://media1.tenor.com/m/6P2n7kzBJPkAAAAd/nino-gotoubun.gif",
    angry: "https://media1.tenor.com/m/4KvQZx-Z59gAAAAd/nino-nakano-nakano-nino.gif",
    blush: "https://media1.tenor.com/m/I1fp-bEt9VgAAAAC/nino-nakano-the-quintessential-quintuplets.gif",
  };

  const [emotion, setEmotion] = useState("idle");

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue) return;

    const newMessage = {
      role: "user",
      content: inputValue,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");
    console.log([...messages, newMessage])

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMessage],
        }),
      });
      if (!response.ok) {
        const error = new Error(response.status);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log("Response from server:", data);

      if (!data || !data.content || !data.emotion) {
        throw new Error("Invalid response structure from server");
      }

      const chatResponse = data.content;
      const emotion = data.emotion;

      setEmotion(emotion);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
        
            content: chatResponse,
            // emotion: emotion,

        },
      ]);
    } catch (error) {
      console.error("Fetch error", error);
      if (error.status === 500) {
        alert("Internal server error, check if LLM is connected");
      }
    } finally {
      setInputValue("");
    }
  };

  const bootLLM = async () => {
    try {
      console.log("bootLLM invoked");
      const bootResponse = await fetch(`${API_URL}/start-4o-mini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log("bootLLM executed");

      if (!bootResponse.ok) {
        const error = new Error(bootResponse.status);
        error.status = bootResponse.status;
        throw error;
      }

      const systemResponse = await bootResponse.json();
      setMessages([
        {
          role: systemResponse.role,
          content: systemResponse.content,
        },
      ]);
      setLoadingLLM(false);
    } catch (error) {
      console.error("Sending system prompt unsuccessful:", error);
    }
  };

  const checkHealth = async () => {
    try {
      const checkHealthResponse = await fetch(`${API_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!checkHealthResponse.ok) {
        const error = new Error(checkHealthResponse.status);
        error.status = checkHealthResponse.status;
        throw error;
      } else {
        const response = await checkHealthResponse.json();
        console.log(response);
      }
    } catch (error) {
      console.error("Check health error:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      bootLLM();
    }
  }, [isLoggedIn]);

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.message);
      } else {
        const data = await response.json();
        const isLogin = data.success;
        console.log(isLogin);
        if (isLogin) {
          console.log("Login success!", data);
          setIsLoggedIn(true);
        } else {
          console.log("Login failed");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="relative w-full h-screen">
        {!isLoggedIn && <Login handleLogin={handleLogin} />}
        <div className={`${!isLoggedIn ? "blur-sm" : ""}`}></div>
        <div className="mockup-window border bg-base-300 w-full h-full flex flex-col pb-4">
          <div className="flex justify-center ">
            <div className=" max-w-full w-64 h-64 rounded-md content-center" onClick={checkHealth}>
              <img src={Emote[emotion]} />
            </div>
          </div>

          {isLoadingLLM ? (
            <div className="text-primary text-3xl">
              <p>Connecting to LLM...</p>
            </div>
          ) : (
            <div></div>
          )}

          <div className="h-full w-full overflow-scroll pb-8 p-5">
            {messages
              .filter((msg) => msg.role !== "system")
              .map((msg, i) => {
                
                
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
            <form
              action="submit"
              className="m-5 form-control flex justify-center"
              onSubmit={sendMessage}
            >
              <div className="flex w-[800px] max-w-full">
                <input
                  className={`${
                    isLoadingLLM ? "text-black-100" : "text-blue-950"
                  } bg-white mb-3 px-3 h-12 w-full rounded-l-sm`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    isLoadingLLM ? "Connecting to LLM" : "Type your message..."
                  }
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
      </div>
    </>
  );
}

export default App;
