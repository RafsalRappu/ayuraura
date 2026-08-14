import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";

import { errorMessage } from "../../api/client";
import { useCustomerAuth } from "../../data/useCustomerAuth";

type Mode = "login" | "signup";

interface AccountAuthProps {
    configured: boolean;
}

const AccountAuth = ({ configured }: AccountAuthProps) => {
    const { login, signup } = useCustomerAuth();
    const [mode, setMode] = useState<Mode>("login");

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const switchMode = () => {
        setMode((current) => (current === "login" ? "signup" : "login"));
        setError(null);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        if (mode === "signup" && password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        setSubmitting(true);
        try {
            if (mode === "login") {
                await login(phone, password);
            } else {
                await signup({ name, phone, password, ...(email ? { email } : {}) });
            }
        } catch (cause) {
            setError(errorMessage(cause, "Could not complete that."));
        } finally {
            setSubmitting(false);
        }
    };

    const missing =
        mode === "login" ? !phone.trim() || !password : !name.trim() || !phone.trim() || !password || !confirmPassword;

    return (
        <Box sx={{ display: "flex", justifyContent: "center", pt: { xs: 6, md: 10 }, px: 2 }}>
            <Paper sx={{ p: 4, borderRadius: 4, width: "100%", maxWidth: 440 }} elevation={0} variant="outlined">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <PersonOutlineIcon color="primary" />
                    <Typography variant="h5" component="h1">
                        {mode === "login" ? "Sign in" : "Create an account"}
                    </Typography>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {mode === "login"
                        ? "Sign in to view your order history."
                        : "Save your details for faster checkout and see your past orders."}
                </Typography>

                {!configured && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Accounts aren't set up yet — you can still check out as a guest.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
                    <Stack spacing={2.5}>
                        {mode === "signup" && (
                            <TextField
                                label="Full name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                fullWidth
                                required
                                autoFocus
                            />
                        )}

                        <TextField
                            label="Phone number"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            fullWidth
                            required
                            autoComplete="tel"
                        />

                        {mode === "signup" && (
                            <TextField
                                label="Email (optional)"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                fullWidth
                            />
                        )}

                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            fullWidth
                            required
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            helperText={mode === "signup" ? "At least 8 characters." : undefined}
                        />

                        {mode === "signup" && (
                            <TextField
                                label="Confirm password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                fullWidth
                                required
                                autoComplete="new-password"
                            />
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={submitting || missing || !configured}
                            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                        >
                            {mode === "login" ? "Sign in" : "Create account"}
                        </Button>

                        <Button fullWidth color="inherit" onClick={switchMode}>
                            {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default AccountAuth;
