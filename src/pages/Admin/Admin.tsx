import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Alert,
    AppBar,
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material";
import { alpha, ThemeProvider, useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import SEO from "../../components/common/SEO";
import { BrandMark } from "../../components/common/BrandLogo";
import { errorMessage } from "../../api/client";
import { fetchSession, logout } from "../../api/admin";
import { createAppTheme } from "../../theme/createAppTheme";
import { useThemePreset } from "../../theme/useThemePreset";
import { EASE_OUT, SPRING_SNAPPY } from "../../theme/motion";
import { serifFont } from "../../theme/typography";
import AdminOverview from "./AdminOverview";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminReviews from "./AdminReviews";
import AdminLogin from "./AdminLogin";
import type { AdminTab } from "./adminTypes";

const DRAWER_WIDTH = 272;

type SessionState =
    | { status: "loading" }
    | { status: "ready"; authenticated: boolean; configured: boolean }
    | { status: "unreachable"; message: string };

interface NavItem {
    tab: AdminTab;
    label: string;
    icon: ReactNode;
    badge?: number;
}

const AdminWordmark = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <BrandMark size={40} />
        <Box>
            <Typography sx={{ fontFamily: serifFont, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>
                AyuAura
            </Typography>
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
                Admin
            </Typography>
        </Box>
    </Box>
);

const Admin = () => {
    const { preset } = useThemePreset();
    // The admin keeps the shop's colors but swaps in dashboard typography and radii.
    const adminTheme = useMemo(() => createAppTheme(preset, "admin"), [preset]);

    return (
        <ThemeProvider theme={adminTheme}>
            <AdminShell />
        </ThemeProvider>
    );
};

const AdminShell = () => {
    const theme = useTheme();
    const [session, setSession] = useState<SessionState>({ status: "loading" });
    const [tab, setTab] = useState<AdminTab>("overview");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [pendingReviews, setPendingReviews] = useState(0);
    const [ordersStatusFilter, setOrdersStatusFilter] = useState<string | undefined>(undefined);

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

    const goTo = (nextTab: AdminTab, options?: { statusFilter?: string }) => {
        setTab(nextTab);
        setOrdersStatusFilter(options?.statusFilter);
        setMobileOpen(false);
    };

    const navItems: NavItem[] = [
        { tab: "overview", label: "Overview", icon: <DashboardOutlinedIcon fontSize="small" /> },
        { tab: "products", label: "Products", icon: <Inventory2OutlinedIcon fontSize="small" /> },
        { tab: "orders", label: "Orders", icon: <ReceiptLongOutlinedIcon fontSize="small" />, badge: pendingOrders },
        { tab: "categories", label: "Categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
        { tab: "coupons", label: "Coupons", icon: <LocalOfferOutlinedIcon fontSize="small" /> },
        { tab: "reviews", label: "Reviews", icon: <RateReviewOutlinedIcon fontSize="small" />, badge: pendingReviews },
    ];

    const currentLabel = navItems.find((item) => item.tab === tab)?.label ?? "Admin";

    // Rendered twice (mobile drawer + desktop rail), so each copy gets its own
    // layoutId — a shared one would make the highlight jump between drawers.
    const renderSidebar = (instance: "mobile" | "desktop") => (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
                <AdminWordmark />
            </Box>

            <Typography
                variant="overline"
                sx={{ px: 3.5, pt: 1, color: "text.disabled", fontSize: "0.6875rem" }}
            >
                Management
            </Typography>

            <List sx={{ flex: 1, px: 2, py: 1 }}>
                {navItems.map((item) => {
                    const active = tab === item.tab;

                    return (
                        <ListItemButton
                            key={item.tab}
                            selected={active}
                            onClick={() => goTo(item.tab)}
                            sx={{
                                position: "relative",
                                minHeight: 44,
                                mb: 0.5,
                                px: 1.5,
                                borderRadius: 2,
                                color: active ? "primary.main" : "text.secondary",
                                "&:hover": { color: active ? "primary.main" : "text.primary" },
                                "&.Mui-selected": {
                                    bgcolor: "transparent",
                                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                },
                            }}
                        >
                            {active && (
                                <motion.span
                                    layoutId={`admin-nav-active-${instance}`}
                                    transition={SPRING_SNAPPY}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: 8,
                                        background: alpha(theme.palette.primary.main, 0.09),
                                    }}
                                />
                            )}

                            <ListItemIcon sx={{ minWidth: 36, color: "inherit", position: "relative" }}>{item.icon}</ListItemIcon>

                            <ListItemText
                                primary={item.label}
                                sx={{ position: "relative" }}
                                slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 700 : 600 } } }}
                            />

                            {!!item.badge && (
                                <Box
                                    component="span"
                                    sx={{
                                        position: "relative",
                                        minWidth: 22,
                                        height: 22,
                                        px: 0.75,
                                        borderRadius: 999,
                                        display: "grid",
                                        placeItems: "center",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "warning.darker",
                                        bgcolor: alpha(theme.palette.warning.main, 0.22),
                                    }}
                                >
                                    {item.badge}
                                </Box>
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ p: 2 }}>
                <Box sx={{ p: 1, borderRadius: 3, bgcolor: "background.neutral" }}>
                    <Button
                        fullWidth
                        component={RouterLink}
                        to="/"
                        target="_blank"
                        color="inherit"
                        startIcon={<OpenInNewIcon fontSize="small" />}
                        sx={{ justifyContent: "flex-start", mb: 0.5, color: "text.secondary", "&:hover": { color: "text.primary" } }}
                    >
                        View site
                    </Button>
                    <Button
                        fullWidth
                        color="inherit"
                        startIcon={<LogoutIcon fontSize="small" />}
                        onClick={() => void handleSignOut()}
                        sx={{ justifyContent: "flex-start", color: "text.secondary", "&:hover": { color: "error.main" } }}
                    >
                        Sign out
                    </Button>
                </Box>
            </Box>
        </Box>
    );

    const isAuthed = session.status === "ready" && session.authenticated;

    const glassBar = {
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: `1px solid ${theme.palette.divider}`,
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <SEO
                title="Product Admin"
                description="Manage the AyuAura product catalogue."
                path="/admin"
                noindex
            />

            {!isAuthed && (
                <AppBar position="sticky" color="transparent" elevation={0} sx={glassBar}>
                    <Toolbar sx={{ gap: 1.5 }}>
                        <BrandMark size={34} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            AyuAura Admin
                        </Typography>
                        <Button component={RouterLink} to="/" color="inherit" size="small" startIcon={<OpenInNewIcon fontSize="small" />}>
                            View site
                        </Button>
                    </Toolbar>
                </AppBar>
            )}

            {session.status === "loading" && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 16 }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        aria-label="Loading"
                        role="status"
                    >
                        <BrandMark size={56} />
                    </motion.div>
                </Box>
            )}

            {session.status === "unreachable" && (
                <Alert
                    severity="error"
                    sx={{ maxWidth: 640, mx: "auto", mt: 6 }}
                    action={
                        <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void refreshSession()}>
                            Retry
                        </Button>
                    }
                >
                    {session.message}
                </Alert>
            )}

            {session.status === "ready" && !session.authenticated && (
                <AdminLogin configured={session.configured} onSignedIn={() => void refreshSession()} />
            )}

            {isAuthed && (
                <Box sx={{ display: "flex" }}>
                    <AppBar
                        position="fixed"
                        color="default"
                        elevation={0}
                        sx={{ ...glassBar, display: { xs: "block", md: "none" } }}
                    >
                        <Toolbar>
                            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5 }} aria-label="Open menu">
                                <MenuRoundedIcon />
                            </IconButton>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                                {currentLabel}
                            </Typography>
                            <BrandMark size={32} />
                        </Toolbar>
                    </AppBar>

                    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                        <Drawer
                            variant="temporary"
                            open={mobileOpen}
                            onClose={() => setMobileOpen(false)}
                            ModalProps={{ keepMounted: true }}
                            sx={{
                                display: { xs: "block", md: "none" },
                                "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
                            }}
                        >
                            {renderSidebar("mobile")}
                        </Drawer>

                        <Drawer
                            variant="permanent"
                            sx={{
                                display: { xs: "none", md: "block" },
                                "& .MuiDrawer-paper": {
                                    width: DRAWER_WIDTH,
                                    borderRight: `1px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
                                },
                            }}
                            open
                        >
                            {renderSidebar("desktop")}
                        </Drawer>
                    </Box>

                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            minWidth: 0,
                            px: { xs: 2, sm: 3, md: 5 },
                            py: { xs: 3, md: 5 },
                            mt: { xs: 7, md: 0 },
                        }}
                    >
                        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } }}
                                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                                >
                                    {tab === "overview" && (
                                        <AdminOverview
                                            onSummary={({ pendingOrders: po, pendingReviews: pr }) => {
                                                setPendingOrders(po);
                                                setPendingReviews(pr);
                                            }}
                                            onNavigate={goTo}
                                        />
                                    )}
                                    {tab === "products" && <AdminDashboard />}
                                    {tab === "orders" && <AdminOrders initialStatusFilter={ordersStatusFilter} />}
                                    {tab === "categories" && <AdminCategories />}
                                    {tab === "coupons" && <AdminCoupons />}
                                    {tab === "reviews" && <AdminReviews />}
                                </motion.div>
                            </AnimatePresence>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default Admin;
