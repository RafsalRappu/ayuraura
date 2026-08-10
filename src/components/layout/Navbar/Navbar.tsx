import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Button,
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

import MenuIcon from "@mui/icons-material/Menu";
import SpaIcon from "@mui/icons-material/Spa";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import ThemeSwitcher from "../../common/ThemeSwitcher";
import { whatsappLink } from "../../../config/site";

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
        </>
    );
};

export default Navbar;