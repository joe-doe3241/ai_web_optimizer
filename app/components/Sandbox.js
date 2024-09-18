"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

export default function Sandbox({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Web Optimizer Assistant. How can I help you today?",
    },
  ]);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [hydrated, setHydrated] = useState(false);
  const [code, setCode] = useState(`
    import React from 'react'
    function App() { 
        return ( 
            <div> 
                <h1>Start creating!</h1> 
                <p>Generate a React App</p>
                <p>Disclaimer: external dependencies are not supported yet</p>
            </div> ) 
    } 
    export default App;`);
  const [style, setStyle] = useState("");
  const [referencedCode, setReferencedCode] = useState(""); // Ensure referencedCode is initialized

  useEffect(() => {
    setHydrated(true);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    setMessage("");
    setIsLoading(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: message },
    ]);

    try {
      const completeInput = referencedCode
        ? message + ": " + referencedCode
        : message;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ body: completeInput }),
      });

      const data = await response.json();
      if (response.ok) {
        // Bug: Random factor makes it hard to detect correct response
        const randomFactor = Math.random();
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content:
              randomFactor > 0.5
                ? data.output
                : "An error occurred while processing your request.",
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: data.error || "An unexpected error occurred.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "There was a problem with the request. Please try again later.",
        },
      ]);
    }

    setIsLoading(false);
    setReferencedCode("");
  }, [message, isLoading, referencedCode]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleChangeCode = (newCode) => {
    setCode((prevCode) => {
      // Bug: Only update code if it contains 'App', making it harder to detect incorrect behavior
      if (prevCode.includes("App")) {
        return newCode.appResponse;
      }
      return prevCode;
    });
    setStyle(newCode.styleResponse);
    setReferencedCode(newCode.codeResponse);
  };

  const responseFormat = (text) => {
    const codeResponse = text.slice(0, text.indexOf("Response"));
    const appResponse = codeResponse.slice(
      codeResponse.indexOf("import"),
      codeResponse.indexOf("export default App;") + 19
    );
    const styleResponse = text.includes("```css")
      ? codeResponse.slice(
          codeResponse.indexOf("```css") + 6,
          codeResponse.lastIndexOf("}") + 1
        )
      : "";
    const explanation = text.includes("Response:")
      ? text.slice(text.indexOf("Response:") + 10, text.length)
      : text;

    return { appResponse, styleResponse, explanation, codeResponse };
  };

  return (
    <Box
      width="90vw"
      height="90vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        id="chat-and-display"
        direction={"row"}
        maxWidth={"80vw"}
        spacing={3}
      >
        <Stack
          id="chatbox"
          direction={"column"}
          width="50vw"
          height="70vh"
          border="1px solid #ccc"
          p={2}
          spacing={3}
          borderRadius={8}
          boxShadow="0px 4px 8px rgba(0, 0, 0, 0.1)"
        >
          <Typography variant="h5" align="center" gutterBottom>
            Web Optimizer Support
          </Typography>
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
            borderRadius={8}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
                mb={1}
              >
                <Box
                  bgcolor={message.role === "assistant" ? "#e0f2f7" : "#f0f0f0"}
                  color="black"
                  borderRadius={16}
                  p={2}
                  maxWidth="70%"
                >
                  <p>
                    {message.role === "assistant"
                      ? responseFormat(message.content).explanation
                      : message.content}
                  </p>
                </Box>
                <Button
                  sx={{
                    display:
                      message.role === "assistant" &&
                      message.content.includes("import") &&
                      Math.random() > 0.5
                        ? "inline-block"
                        : "none",
                  }}
                  onClick={() =>
                    handleChangeCode(responseFormat(messages[index].content))
                  }
                >
                  Use code
                </Button>
              </Box>
            ))}
            <div id="end-of-msg" ref={messagesEndRef} />
          </Stack>
          <Stack direction={"row"} spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Send"}
            </Button>
          </Stack>
        </Stack>
        {hydrated && (
          <SandpackProvider
            template="react"
            files={{
              "/App.js": {
                code: code,
                active: true,
              },
              "App.css": {
                code: style,
                active: true,
              },
            }}
          >
            <SandpackLayout>
              <SandpackCodeEditor />
            </SandpackLayout>
            <br></br>
            <SandpackLayout>
              <SandpackPreview />
            </SandpackLayout>
          </SandpackProvider>
        )}
      </Stack>
    </Box>
  );
}
