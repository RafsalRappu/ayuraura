import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Alert,
    AppBar,
    Badge,
    Box,
    Button,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material";
import SpaIcon from "@mui/icons-material/Spa";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import SEO from "../../components/common/SEO";
import { errorMessage } from "../../api/client";
import { fetchSession, logout } from "../../api/admin";
import AdminOverview from "./AdminOverview";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminReviews from "./AdminReviews";
import AdminLogin from "./AdminLogin";
import type { AdminTab } from "./adminTypes";

const DRAWER_WIDTH = 252;

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

const Admin = () => {
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

    const sidebarContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Toolbar sx={{ gap: 1, px: 2.5 }}>
                <SpaIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    AyuAura Admin
                </Typography>
            </Toolbar>

            <Divider />

            <List sx={{ flex: 1, px: 1.5, py: 2 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.tab}
                        selected={tab === item.tab}
                        onClick={() => goTo(item.tab)}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            "&.Mui-selected": {
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                                "&:hover": { bgcolor: "primary.dark" },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }}
                        />
                        {!!item.badge && (
                            <Badge
                                badgeContent={item.badge}
                                color={tab === item.tab ? "default" : "warning"}
                                sx={
                                    tab === item.tab
                                        ? { "& .MuiBadge-badge": { bgcolor: "primary.contrastText", color: "primary.main" } }
                                        : undefined
                                }
                            />
                        )}
                    </ListItemButton>
                ))}
            </List>

            <Divider />

            <Box sx={{ p: 1.5 }}>
                <Button
                    fullWidth
                    component={RouterLink}
                    to="/"
                    target="_blank"
                    color="inherit"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ justifyContent: "flex-start", mb: 0.5 }}
                >
                    View site
                </Button>
                <Button
                    fullWidth
                    color="inherit"
                    startIcon={<LogoutIcon fontSize="small" />}
                    onClick={() => void handleSignOut()}
                    sx={{ justifyContent: "flex-start" }}
                >
                    Sign out
                </Button>
            </Box>
        </Box>
    );

    const isAuthed = session.status === "ready" && session.authenticated;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <SEO
                title="Product Admin"
                description="Manage the AyuAura product catalogue."
                path="/admin"
                noindex
            />

            {!isAuthed && (
                <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Toolbar>
                        <SpaIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            AyuAura Admin
                        </Typography>
                        <Button component={RouterLink} to="/" color="inherit" size="small">
                            View site
                        </Button>
                    </Toolbar>
                </AppBar>
            )}

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
                        sx={{
                            display: { xs: "block", md: "none" },
                            borderBottom: 1,
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <Toolbar>
                            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5 }}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                                {currentLabel}
                            </Typography>
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
                            {sidebarContent}
                        </Drawer>

                        <Drawer
                            variant="permanent"
                            sx={{
                                display: { xs: "none", md: "block" },
                                "& .MuiDrawer-paper": {
                                    width: DRAWER_WIDTH,
                                    borderRight: 1,
                                    borderColor: "divider",
                                },
                            }}
                            open
                        >
                            {sidebarContent}
                        </Drawer>
                    </Box>

                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            minWidth: 0,
                            px: { xs: 2.5, md: 4 },
                            py: { xs: 3, md: 5 },
                            mt: { xs: 7, md: 0 },
                        }}
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
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default Admin;
