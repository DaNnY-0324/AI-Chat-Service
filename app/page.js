"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  Box,
  Button,
  Stack,
  TextField,
  CssBaseline,
  CircularProgress,
  Switch,
  FormControlLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../app/firebase/config";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";

// Define your themes
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});

// Function to generate a summary for each conversation
function generateSummary(conversation) {
  const summary = conversation.messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.split(" ").slice(0, 5).join(" "))
    .join(" ")
    .slice(0, 50); // Limit the summary to 50 characters
  return summary || "No summary available";
}

// Feedback buttons component
function FeedbackButtons({ onFeedback }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ThumbUpAltIcon />}
        onClick={() => onFeedback("positive")}
      >
        Like
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<ThumbDownAltIcon />}
        onClick={() => onFeedback("negative")}
        sx={{ ml: 2 }}
      >
        Dislike
      </Button>
    </Box>
  );
}

// Sidebar component with theme selector and delete functionality
function Sidebar({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  isDarkTheme,
  toggleTheme,
}) {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
      }}
    >
      <Box sx={{ padding: 2 }}>
        {/* Theme Toggle Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={isDarkTheme}
              onChange={toggleTheme}
              color="primary"
            />
          }
          label={isDarkTheme ? "Dark Mode" : "Light Mode"}
        />
      </Box>
      <Divider />
      <List>
        {conversations.map((conversation, index) => (
          <ListItem
            key={index}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Box
              onClick={() => onSelectConversation(index)}
              sx={{ flexGrow: 1, cursor: "pointer" }}
            >
              <ListItemText
                primary={generateSummary(conversation)}
                secondary={new Date(conversation.date).toLocaleString()}
              />
            </Box>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => onDeleteConversation(index)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to the Chatbot",
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationIndex, setSelectedConversationIndex] =
    useState(null);
  const messagesEndRef = useRef(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    setIsDarkTheme(savedTheme === "dark" ? true : false);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: "user", content: message };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      { role: "assistant", content: "" },
    ]);

    setMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        assistantMessage += text;

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: assistantMessage },
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in"); // Redirect to the sign-in page after logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Handle feedback
  const handleFeedback = (feedbackType) => {
    console.log(`Feedback received: ${feedbackType}`);
    setFeedbackVisible(false);
  };

  // Timer to show feedback buttons after inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (message.trim()) {
        setFeedbackVisible(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [message]);

  // Reset the timer when the user types
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setFeedbackVisible(false);
  };

  // Save the current conversation and start a new one
  const startNewConversation = () => {
    const newConvo = {
      date: Date.now(),
      messages,
    };
    setConversations([...conversations, newConvo]);
    setMessages([
      {
        role: "assistant",
        content: "Welcome to the Chatbot",
      },
    ]);
  };

  // Select a conversation to view
  const selectConversation = (index) => {
    const selectedConvo = conversations[index];
    setMessages(selectedConvo.messages);
    setSelectedConversationIndex(index);
  };

  // Delete a conversation
  const deleteConversation = (index) => {
    const updatedConversations = conversations.filter((_, i) => i !== index);
    setConversations(updatedConversations);
    setMessages([
      {
        role: "assistant",
        content: "Welcome to the Chatbot",
      },
    ]);
    setSelectedConversationIndex(null);
  };

  // Toggle theme and save preference in localStorage
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem("preferredTheme", !isDarkTheme ? "dark" : "light");
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!user) {
    return null; // Prevents rendering the rest of the component if the user is not authenticated
  }

  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <Head>
        <title>Welcome to the Chatbot | Your App Name</title>
      </Head>
      <CssBaseline />
      <Box display="flex">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
        />
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          sx={{ marginLeft: "240px" }} // Offset for the sidebar
        >
          {/* Logout Button */}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{ position: "absolute", top: 20, right: 20 }}
          >
            Logout
          </Button>

          <Stack
            direction={"column"}
            width="500px"
            height="700px"
            border="1px solid #333"
            p={2}
            spacing={3}
            bgcolor="background.paper"
            borderRadius={2}
          >
            <Stack
              direction={"column"}
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {messages.map((message, index) => (
                <Box key={index} display="flex" flexDirection="column">
                  <Box
                    display="flex"
                    justifyContent={
                      message.role === "assistant" ? "flex-start" : "flex-end"
                    }
                  >
                    <Box
                      bgcolor={
                        message.role === "assistant"
                          ? "primary.main"
                          : "secondary.main"
                      }
                      color="white"
                      borderRadius={16}
                      p={2}
                    >
                      {message.content}
                    </Box>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            <Stack direction={"row"} spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={handleMessageChange}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) sendMessage();
                }}
                disabled={isLoading}
                InputLabelProps={{ style: { color: "text.primary" } }}
                InputProps={{
                  style: { color: "text.primary" },
                }}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : "Send"}
              </Button>
            </Stack>
            {/* Show FeedbackButtons only when feedbackVisible is true */}
            {feedbackVisible && <FeedbackButtons onFeedback={handleFeedback} />}
          </Stack>
          {/* New Conversation Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={startNewConversation}
            sx={{ marginTop: 2 }}
          >
            Start New Conversation
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
