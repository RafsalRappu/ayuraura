import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
    AppBar,
    Toolbar,
    Box,
    Typography,
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
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";

import MenuIcon from "@mui/icons-material/Menu";
import SpaIcon from "@mui/icons-material/Spa";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";

import ThemeSwitcher from "../../common/ThemeSwitcher";
import CartDrawer from "../../cart/CartDrawer";
import { whatsappLink } from "../../../config/site";
import { useCart } from "../../../data/useCart";
import { cartCount } from "../../../data/cart";
import { useCustomerAuth } from "../../../data/useCustomerAuth";

import styles from "./Navbar.module.css";

const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
];

const Navbar = () => {
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const location = useLocation();

    const [open, setOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const { items } = useCart();
    const itemCount = cartCount(items);
    const { customer } = useCustomerAuth();

    const cartButton = (
        <IconButton onClick={() => setCartOpen(true)} aria-label="Open cart">
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
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ display: "inline-block" }}
                        >
                            {itemCount}
                        </motion.span>
                    </AnimatePresence>
                }
            >
                <ShoppingCartOutlinedIcon />
            </Badge>
        </IconButton>
    );

    const accountButton = (
        <IconButton component={RouterLink} to="/account" aria-label={customer ? "My account" : "Sign in"}>
            <PersonOutlineIcon />
        </IconButton>
    );

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                color="inherit"
                className={styles.appBar}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters className={styles.toolbar}>
                        {/* Logo */}

                        <Box
                            component={RouterLink}
                            to="/"
                            className={styles.logo}
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                            <SpaIcon color="primary" />

                            <Typography variant="h5">
                                AyuAura
                            </Typography>
                        </Box>

                        {/* Desktop */}

                        {!isMobile && (
                            <>
                                <Box className={styles.menu}>
                                    {navItems.map((item) => (
                                        <Button
                                            key={item.path}
                                            component={RouterLink}
                                            to={item.path}
                                            className={
                                                location.pathname === item.path
                                                    ? styles.activeButton
                                                    : styles.menuButton
                                            }
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </Box>

                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                    <ThemeSwitcher />

                                    {accountButton}

                                    {cartButton}

                                    <Button
                                        variant="contained"
                                        startIcon={<WhatsAppIcon />}
                                        color="primary"
                                        href={whatsappLink("Hi AyuAura, I'd like to place an order.")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            borderRadius: 100,
                                            px: 3,
                                        }}
                                    >
                                        Order Now
                                    </Button>
                                </Stack>
                            </>
                        )}

                        {/* Mobile */}

                        {isMobile && (
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <ThemeSwitcher />

                                {accountButton}

                                {cartButton}

                                <IconButton onClick={() => setOpen(true)} aria-label="Open navigation menu">
                                    <MenuIcon />
                                </IconButton>
                            </Stack>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Drawer */}

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
            >
                <Box sx={{ width: 260 }}>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.path} disablePadding>
                                <ListItemButton
                                    component={RouterLink}
                                    to={item.path}
                                    onClick={() => setOpen(false)}
                                >
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        <ListItem>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<WhatsAppIcon />}
                                href={whatsappLink("Hi AyuAura, I'd like to place an order.")}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Order
                            </Button>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
};

export default Navbar;