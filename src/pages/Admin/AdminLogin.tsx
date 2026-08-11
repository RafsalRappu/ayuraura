import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { errorMessage } from "../../api/client";
import { login } from "../../api/admin";

interface AdminLoginProps {
    configured: boolean;
    onSignedIn: () => void;
}

const AdminLogin = ({ configured, onSignedIn }: AdminLoginProps) => {
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await login(password);
            setPassword("");
            onSignedIn();
        } catch (cause) {
            setError(errorMessage(cause, "Could not sign in."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", pt: { xs: 6, md: 12 }, px: 2 }}>
            <Paper sx={{ p: 4, borderRadius: 4, width: "100%", maxWidth: 420 }} elevation={0} variant="outlined">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <LockOutlinedIcon color="primary" />
                    <Typography variant="h5" component="h1">
                        Product admin
                    </Typography>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to add and edit the products shown on the site.
                </Typography>

                {!configured && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Admin access is not set up yet. Add <strong>ADMIN_PASSWORD</strong> and{" "}
                        <strong>ADMIN_SESSION_SECRET</strong> to the project's environment variables,
                        then redeploy.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        fullWidth
                        autoFocus
                        autoComplete="current-password"
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={submitting || !password || !configured}
                        startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                    >
                        Sign in
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default AdminLogin;
