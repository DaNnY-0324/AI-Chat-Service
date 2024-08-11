"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Container,
  CssBaseline,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Link,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";
import { useRouter } from "next/navigation";
import { darkTheme, lightTheme } from "../theme"; // Import themes
import { ThemeProvider } from "@mui/material/styles";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const router = useRouter();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Theme state management
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Toggle theme and save preference in localStorage
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem("preferredTheme", !isDarkTheme ? "dark" : "light");
  };

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    setIsDarkTheme(savedTheme === "dark" ? true : false);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(email, password);
      router.push("/"); // Redirect to the home page after successful sign-in
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        setSnackbarOpen(true);
        setTimeout(() => {
          router.push("/sign-up");
        }, 500);
      } else {
        console.error("Sign-In Error:", e);
      }
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <Head>
        <title>Sign In | Your App Name</title>
      </Head>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "background.paper",
            padding: 4,
            borderRadius: 2,
            boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>
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
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{
                style: { color: "text.primary" },
              }}
              InputProps={{
                style: { color: "text.primary" },
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{
                style: { color: "text.primary" },
              }}
              InputProps={{
                style: { color: "text.primary" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
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
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
            {error && error.code !== "auth/user-not-found" && (
              <Typography variant="body2" color="error">
                {error.message}
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" variant="body2">
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message="Account not found. Redirecting to sign up."
        />
      </Container>
    </ThemeProvider>
  );
}
