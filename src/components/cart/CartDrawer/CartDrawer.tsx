import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import CustomButton from "../../common/CustomButton";
import QuantityStepper from "../../common/QuantityStepper";
import { useCart } from "../../../data/useCart";
import { buildWhatsAppMessage, cartCount, cartTotal } from "../../../data/cart";
import { whatsappLink } from "../../../config/site";
import { EASE_OUT } from "../../../theme/motion";

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
    const navigate = useNavigate();
    const { items, setQuantity, removeItem, clear } = useCart();
    const total = cartTotal(items);
    const count = cartCount(items);

    const handleCheckout = () => {
        onClose();
        navigate("/checkout");
    };

    const handleQuickWhatsAppOrder = () => {
        window.open(whatsappLink(buildWhatsAppMessage(items)), "_blank", "noopener,noreferrer");
        clear();
        onClose();
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: { xs: "100vw", sm: 420 }, display: "flex", flexDirection: "column", height: "100%" }}>
                <Stack
                    direction="row"
                    sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2.5 }}
                >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <Typography variant="h6">Your Cart</Typography>
                        {count > 0 && <Chip label={count} size="small" color="primary" />}
                    </Stack>
                    <IconButton onClick={onClose} aria-label="Close cart">
                        <CloseRoundedIcon />
                    </IconButton>
                </Stack>

                <Divider sx={{ borderStyle: "dashed" }} />

                {items.length === 0 ? (
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            p: 4,
                        }}
                    >
                        <Box
                            sx={(theme) => ({
                                width: 88,
                                height: 88,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                color: "primary.main",
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                            })}
                        >
                            <ShoppingBagOutlinedIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography color="text.secondary" sx={{ textAlign: "center", maxWidth: 260 }}>
                            Your cart is empty — add a product to get started.
                        </Typography>
                    </Box>
                ) : (
                    <Stack sx={{ flex: 1, overflowY: "auto", px: 3, py: 1 }}>
                        <AnimatePresence initial={false}>
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.key}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0, x: 40 }}
                                    transition={{ duration: 0.35, ease: EASE_OUT }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={(theme) => ({
                                            alignItems: "center",
                                            py: 2,
                                            borderTop: index === 0 ? "none" : `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                                        })}
                                    >
                                        <Avatar
                                            src={item.image}
                                            variant="rounded"
                                            sx={(theme) => ({
                                                width: 68,
                                                height: 68,
                                                bgcolor: "background.neutral",
                                                color: "primary.main",
                                                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                                            })}
                                        >
                                            {item.name.charAt(0)}
                                        </Avatar>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography noWrap sx={{ fontWeight: 700 }}>
                                                {item.name}
                                            </Typography>
                                            {item.variantLabel && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.variantLabel}
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                                                ₹{item.price * item.quantity}
                                            </Typography>
                                            <QuantityStepper
                                                value={item.quantity}
                                                onChange={(value) => setQuantity(item.key, value)}
                                            />
                                        </Box>

                                        <IconButton
                                            size="small"
                                            aria-label={`Remove ${item.name} from cart`}
                                            onClick={() => removeItem(item.key)}
                                            sx={{ alignSelf: "flex-start", color: "text.disabled", "&:hover": { color: "error.main" } }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Stack>
                )}

                {items.length > 0 && (
                    <Box sx={{ p: 3, bgcolor: "background.neutral" }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.375rem" }} color="primary">
                                ₹{total}
                            </Typography>
                        </Stack>

                        <CustomButton
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<ShoppingCartCheckoutIcon />}
                            onClick={handleCheckout}
                            sx={(theme) => ({ mb: 1.25, boxShadow: theme.customShadows.primary })}
                        >
                            Checkout
                        </CustomButton>

                        <CustomButton
                            variant="outlined"
                            fullWidth
                            startIcon={<WhatsAppIcon />}
                            onClick={handleQuickWhatsAppOrder}
                            sx={{ mb: 1, bgcolor: "background.paper" }}
                        >
                            Order via WhatsApp
                        </CustomButton>

                        <Button fullWidth color="inherit" onClick={clear} sx={{ color: "text.secondary" }}>
                            Clear cart
                        </Button>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
};

export default CartDrawer;
