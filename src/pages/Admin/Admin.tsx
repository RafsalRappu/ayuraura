import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Alert,
    AppBar,
    Box,
    Button,
    CircularProgress,
    Container,
    Tab,
    Tabs,
    Toolbar,
    Typography,
} from "@mui/material";
import SpaIcon from "@mui/icons-material/Spa";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";

import SEO from "../../components/common/SEO";
import { errorMessage } from "../../api/client";
import { fetchSession, logout } from "../../api/admin";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminReviews from "./AdminReviews";
import AdminLogin from "./AdminLogin";

type AdminTab = "products" | "orders" | "categories" | "coupons" | "reviews";

type SessionState =
    | { status: "loading" }
    | { status: "ready"; authenticated: boolean; configured: boolean }
    | { status: "unreachable"; message: string };

const Admin = () => {
    const [session, setSession] = useState<SessionState>({ status: "loading" });
    const [tab, setTab] = useState<AdminTab>("products");

    const refreshSession = useCallback(async () => {
        setSession({ status: "loading" });
        try {
            const { authenticated, configured } = await fetchSession();
            setSession({ status: "ready", authenticated, configured });
        } catch (error) {
            // Say so plainly rather than showing a sign-in form that cannot work.
            setSession({
                status: "unreachable",
                message: errorMessage(error, "Could not reach the admin API."),
            });
        }
    }, []);

    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

    const handleSignOut = async () => {
        try {
            await logout();
        } finally {
            void refreshSession();
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <SEO
                title="Product Admin"
                description="Manage the AyuAura product catalogue."
                path="/admin"
                noindex
            />

            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Toolbar>
                    <SpaIcon color="primary" sx={{ mr: 1 }} />

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        AyuAura Admin
                    </Typography>

                    <Button component={RouterLink} to="/" color="inherit" size="small">
                        View site
                    </Button>

                    {session.status === "ready" && session.authenticated && (
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={() => void handleSignOut()}
                        >
                            Sign out
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
                {session.status === "loading" && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                        <CircularProgress color="primary" />
                    </Box>
                )}

                {session.status === "unreachable" && (
                    <Alert
                        severity="error"
                        sx={{ maxWidth: 640, mx: "auto", mt: 6 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={() => void refreshSession()}
                            >
                                Retry
                            </Button>
                        }
                    >
                        {session.message}
                    </Alert>
                )}

                {session.status === "ready" &&
                    (session.authenticated ? (
                        <>
                            <Tabs
                                value={tab}
                                onChange={(_, value: AdminTab) => setTab(value)}
                                sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
                            >
                                <Tab label="Products" value="products" />
                                <Tab label="Orders" value="orders" />
                                <Tab label="Categories" value="categories" />
                                <Tab label="Coupons" value="coupons" />
                                <Tab label="Reviews" value="reviews" />
                            </Tabs>

                            {tab === "products" && <AdminDashboard />}
                            {tab === "orders" && <AdminOrders />}
                            {tab === "categories" && <AdminCategories />}
                            {tab === "coupons" && <AdminCoupons />}
                            {tab === "reviews" && <AdminReviews />}
                        </>
                    ) : (
                        <AdminLogin
                            configured={session.configured}
                            onSignedIn={() => void refreshSession()}
                        />
                    ))}
            </Container>
        </Box>
    );
};

export default Admin;
