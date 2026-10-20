import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
    AppBar,
    Toolbar,
    Box,
    Button,
    Badge,
    Container,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    useMediaQuery,
    useScrollTrigger,
} from "@mui/material";

import { alpha, useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";

import BrandLogo from "../../common/BrandLogo";
import ThemeSwitcher from "../../common/ThemeSwitcher";
import CartDrawer from "../../cart/CartDrawer";
import { siteConfig, whatsappLink } from "../../../config/site";
import { useCart } from "../../../data/useCart";
import { cartCount } from "../../../data/cart";
import { useCustomerAuth } from "../../../data/useCustomerAuth";
import { CSS_EASE_OUT, EASE_OUT, SPRING_SNAPPY } from "../../../theme/motion";
import { serifFont } from "../../../theme/typography";

const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
];

const iconButtonSx = { width: 42, height: 42, color: "text.primary" } as const;

const Navbar = () => {
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const location = useLocation();

    const [open, setOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const { items } = useCart();
    const itemCount = cartCount(items);
    const { customer } = useCustomerAuth();

    // Past the first few pixels the bar condenses and gains a hairline + shadow.
    const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 12 });

    const cartButton = (
        <IconButton onClick={() => setCartOpen(true)} aria-label="Open cart" sx={iconButtonSx}>
            <Badge
                invisible={itemCount === 0}
                color="secondary"
                badgeContent={
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={itemCount}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                            style={{ display: "inline-block" }}
                        >
                            {itemCount}
                        </motion.span>
                    </AnimatePresence>
                }
            >
                <ShoppingBagOutlinedIcon />
            </Badge>
        </IconButton>
    );

    const accountButton = (
        <IconButton
            component={RouterLink}
            to="/account"
            aria-label={customer ? "My account" : "Sign in"}
            sx={iconButtonSx}
        >
            <PersonOutlineIcon />
        </IconButton>
    );

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                color="inherit"
                sx={{
                    bgcolor: alpha(theme.palette.background.default, scrolled ? 0.84 : 0.62),
                    backdropFilter: "blur(18px) saturate(180%)",
                    WebkitBackdropFilter: "blur(18px) saturate(180%)",
                    borderBottom: "1px solid",
                    borderColor: scrolled ? "divider" : "transparent",
                    boxShadow: scrolled ? `0 12px 32px -20px ${alpha(theme.palette.grey[600], 0.4)}` : "none",
                    transition: theme.transitions.create(["background-color", "border-color", "box-shadow"], {
                        duration: 300,
                    }),
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar
                        disableGutters
                        sx={{
                            height: { xs: 68, md: scrolled ? 68 : 84 },
                            gap: 2,
                            justifyContent: "space-between",
                            transition: `height .35s ${CSS_EASE_OUT}`,
                        }}
                    >
                        {/* Logo */}

                        <Box
                            component={RouterLink}
                            to="/"
                            aria-label={`${siteConfig.name} home`}
                            sx={{ display: "flex", textDecoration: "none" }}
                        >
                            <BrandLogo />
                        </Box>

                        {/* Desktop */}

                        {!isMobile && (
                            <Box
                                component="nav"
                                aria-label="Main"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    p: 0.5,
                                    borderRadius: 999,
                                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                                    border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                                }}
                            >
                                {navItems.map((item) => {
                                    const active = location.pathname === item.path;

                                    return (
                                        <Button
                                            key={item.path}
                                            component={RouterLink}
                                            to={item.path}
                                            aria-current={active ? "page" : undefined}
                                            sx={{
                                                position: "relative",
                                                minHeight: 38,
                                                px: 2.25,
                                                py: 0.75,
                                                fontWeight: 600,
                                                fontSize: "0.9rem",
                                                color: active ? "text.primary" : "text.secondary",
                                                "&:hover": { bgcolor: "transparent", color: "text.primary" },
                                                "&:active": { transform: "none" },
                                            }}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="navbar-active-pill"
                                                    transition={SPRING_SNAPPY}
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        borderRadius: 999,
                                                        background: theme.palette.background.paper,
                                                        boxShadow: theme.customShadows.z4,
                                                    }}
                                                />
                                            )}
                                            <Box component="span" sx={{ position: "relative", zIndex: 1 }}>
                                                {item.label}
                                            </Box>
                                        </Button>
                                    );
                                })}
                            </Box>
                        )}

                        <Stack direction="row" spacing={{ xs: 0.25, md: 0.75 }} sx={{ alignItems: "center" }}>
                            <ThemeSwitcher />

                            {accountButton}

                            {cartButton}

                            {!isMobile ? (
                                <Button
                                    variant="contained"
                                    startIcon={<WhatsAppIcon />}
                                    color="primary"
                                    href={whatsappLink("Hi AyuAura, I'd like to place an order.")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ ml: 1, px: 2.75 }}
                                >
                                    Order Now
                                </Button>
                            ) : (
                                <IconButton
                                    onClick={() => setOpen(true)}
                                    aria-label="Open navigation menu"
                                    sx={iconButtonSx}
                                >
                                    <MenuRoundedIcon />
                                </IconButton>
                            )}
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Drawer */}

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                sx={{ "& .MuiDrawer-paper": { width: { xs: "86vw", sm: 340 }, maxWidth: 360 } }}
            >
                <Stack sx={{ height: "100%", p: 2.5 }}>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                        <BrandLogo />
                        <IconButton onClick={() => setOpen(false)} aria-label="Close navigation menu">
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>

                    <List sx={{ flex: 1 }}>
                        {navItems.map((item, index) => {
                            const active = location.pathname === item.path;

                            return (
                                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                    <motion.div
                                        style={{ width: "100%" }}
                                        initial={{ opacity: 0, x: 24 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.06 + index * 0.05, duration: 0.5, ease: EASE_OUT }}
                                    >
                                        <ListItemButton
                                            component={RouterLink}
                                            to={item.path}
                                            selected={active}
                                            onClick={() => setOpen(false)}
                                            sx={{
                                                py: 1.25,
                                                px: 2,
                                                borderRadius: 3,
                                                "&.Mui-selected": {
                                                    color: "primary.main",
                                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.14) },
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={item.label}
                                                slotProps={{
                                                    primary: {
                                                        sx: { fontFamily: serifFont, fontSize: "1.6rem", fontWeight: 600 },
                                                    },
                                                }}
                                            />
                                        </ListItemButton>
                                    </motion.div>
                                </ListItem>
                            );
                        })}
                    </List>

                    <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        href={whatsappLink("Hi AyuAura, I'd like to place an order.")}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Order
                    </Button>
                </Stack>
            </Drawer>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
};

export default Navbar;
