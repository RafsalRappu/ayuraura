import { useState } from "react";
import type { FormEvent } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { errorMessage } from "../../api/client";
import { useCustomerAuth } from "../../data/useCustomerAuth";
import { EASE_OUT } from "../../theme/motion";

type Mode = "login" | "signup";

interface AccountAuthProps {
    configured: boolean;
}

/** Eye toggle for a password field's end adornment. */
const RevealToggle = ({ shown, onToggle }: { shown: boolean; onToggle: () => void }) => (
    <InputAdornment position="end">
        <IconButton
            aria-label={shown ? "Hide password" : "Show password"}
            onClick={onToggle}
            onMouseDown={(event) => event.preventDefault()}
            edge="end"
        >
            {shown ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
        </IconButton>
    </InputAdornment>
);

/** Fields that only exist in sign-up mode slide in and out instead of popping. */
const Collapsible = ({ show, children }: { show: boolean; children: React.ReactNode }) => (
    <AnimatePresence initial={false}>
        {show && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                style={{ overflow: "hidden" }}
            >
                <Box sx={{ pt: 0.75, pb: 0.25 }}>{children}</Box>
            </motion.div>
        )}
    </AnimatePresence>
);

const AccountAuth = ({ configured }: AccountAuthProps) => {
    const { login, signup } = useCustomerAuth();
    const [mode, setMode] = useState<Mode>("login");

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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

    const passwordAdornment = {
        input: { endAdornment: <RevealToggle shown={showPassword} onToggle={() => setShowPassword((shown) => !shown)} /> },
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", pt: { xs: 2, md: 4 } }}>
            <Card
                sx={(theme) => ({
                    p: { xs: 3, sm: 5 },
                    width: "100%",
                    maxWidth: 460,
                    boxShadow: theme.customShadows.z24,
                })}
            >
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Box
                        sx={(theme) => ({
                            width: 56,
                            height: 56,
                            mx: "auto",
                            mb: 2,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                        })}
                    >
                        <PersonOutlineIcon />
                    </Box>

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                        >
                            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                                {mode === "login" ? "Sign in" : "Create an account"}
                            </Typography>

                            <Typography color="text.secondary" variant="body2">
                                {mode === "login"
                                    ? "Sign in to view your order history."
                                    : "Save your details for faster checkout and see your past orders."}
                            </Typography>
                        </motion.div>
                    </AnimatePresence>
                </Box>

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
                    <Stack spacing={2.25}>
                        <Collapsible show={mode === "signup"}>
                            <TextField
                                label="Full name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                fullWidth
                                required
                                autoFocus
                            />
                        </Collapsible>

                        <TextField
                            label="Phone number"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            fullWidth
                            required
                            autoComplete="tel"
                        />

                        <Collapsible show={mode === "signup"}>
                            <TextField
                                label="Email (optional)"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                fullWidth
                            />
                        </Collapsible>

                        <TextField
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            fullWidth
                            required
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            helperText={mode === "signup" ? "At least 8 characters." : undefined}
                            slotProps={passwordAdornment}
                        />

                        <Collapsible show={mode === "signup"}>
                            <TextField
                                label="Confirm password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                fullWidth
                                required
                                autoComplete="new-password"
                                slotProps={passwordAdornment}
                            />
                        </Collapsible>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={submitting || missing || !configured}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                            {mode === "login" ? "Sign in" : "Create account"}
                        </Button>

                        <Button fullWidth color="inherit" onClick={switchMode} sx={{ color: "text.secondary" }}>
                            {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
                        </Button>
                    </Stack>
                </Box>
            </Card>
        </Box>
    );
};

export default AccountAuth;
