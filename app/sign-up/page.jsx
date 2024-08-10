"use client";

import { useState } from "react";
import {
  Container,
  CssBaseline,
  TextField,
  Button,
  Typography,
  Box,
  Link,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/config"; // Ensure Firestore and Auth are imported correctly
import { useRouter } from "next/navigation";
import { setDoc, doc } from "firebase/firestore";

const theme = createTheme({
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
  typography: {
    h4: {
      color: "#ffffff",
    },
    body1: {
      color: "#ffffff",
    },
  },
});

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      // Add error handling and validation
      try {
        // Store user's first and last name in Firestore
        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
        });

        console.log(
          "User signed up successfully, redirecting to sign-in page..."
        );

        // Redirect to the sign-in page after successful sign-up
        router.push("/sign-in");
      } catch (firestoreError) {
        console.error("Error writing document: ", firestoreError);
        // Handle specific Firestore errors or show an error message to the user
        alert(
          "An error occurred while saving your information. Please try again."
        );
      }
    } catch (authError) {
      console.error("Sign-Up Error: ", authError);
      // Handle authentication errors
      alert(
        "An error occurred during sign-up. Please check your information and try again."
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: theme.palette.background.paper,
            padding: 4,
            borderRadius: 2,
            boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="first-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              InputLabelProps={{
                style: { color: "#ffffff" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              InputLabelProps={{
                style: { color: "#ffffff" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{
                style: { color: "#ffffff" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{
                style: { color: "#ffffff" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputLabelProps={{
                style: { color: "#ffffff" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Sign Up
            </Button>
            {error && (
              <Typography variant="body2" color="error">
                {error.message}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                align="center"
                sx={{ color: "#ffffff" }}
              >
                Already have an account?{" "}
                <Link href="/sign-in" variant="body2" sx={{ color: "#90caf9" }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
