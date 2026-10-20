import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { errorMessage } from "../../api/client";
import { login } from "../../api/admin";

interface AdminLoginProps {
    configured: boolean;
    needsSetup: boolean;
    onSignedIn: () => void;
}

const AdminLogin = ({ configured, needsSetup, onSignedIn }: AdminLoginProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await login(username, password);
            setPassword("");
            onSignedIn();
        } catch (cause) {
            setError(errorMessage(cause, "Could not sign in."));
        } finally {
            setSubmitting(false);
        }
    };

    const trackCapsLock = (event: React.KeyboardEvent) => {
        setCapsLock(event.getModifierState("CapsLock"));
    };

    return (
        <Box
            sx={{
                minHeight: "calc(100vh - 64px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                py: { xs: 4, md: 6 },
                background: (theme) =>
                    `radial-gradient(circle at 20% 15%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 45%),
                     radial-gradient(circle at 85% 85%, ${alpha(theme.palette.primary.main, 0.06)}, transparent 40%)`,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    p: { xs: 3, sm: 5 },
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: (theme) => theme.customShadows.z24,
                }}
            >
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            mx: "auto",
                            mb: 2,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            color: "primary.main",
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        }}
                    >
                        <LockOutlinedIcon />
                    </Box>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                        Welcome back
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Sign in to manage products, orders and more.
                    </Typography>
                </Box>

                {!configured && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                        Admin access is not set up yet. Add <strong>ADMIN_PASSWORD</strong> and{" "}
                        <strong>ADMIN_SESSION_SECRET</strong> to the project's environment variables,
                        then redeploy.
                    </Alert>
                )}

                {configured && needsSetup && (
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        First sign-in: use the username <strong>admin</strong> with the{" "}
                        <strong>ADMIN_PASSWORD</strong> set on the server. That creates the first admin
                        account — add the rest from the Admins page.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        fullWidth
                        autoFocus
                        autoComplete="username"
                        slotProps={{ input: { sx: { borderRadius: 3 } }, htmlInput: { autoCapitalize: "none", spellCheck: false } }}
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={trackCapsLock}
                        onKeyUp={trackCapsLock}
                        fullWidth
                        autoComplete="current-password"
                        helperText={capsLock ? "Caps Lock is on" : " "}
                        slotProps={{
                            formHelperText: { sx: { color: "warning.main" } },
                            input: {
                                sx: { borderRadius: 3 },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((shown) => !shown)}
                                            onMouseDown={(event) => event.preventDefault()}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={submitting || !username.trim() || !password || !configured}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 600, boxShadow: "none" }}
                    >
                        {submitting ? "Signing in…" : "Sign in"}
                    </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
                    Restricted area · AyuAura team only
                </Typography>
            </Paper>
        </Box>
    );
};

export default AdminLogin;
