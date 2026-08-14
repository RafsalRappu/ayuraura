import {
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import CustomButton from "../../common/CustomButton";
import QuantityStepper from "../../common/QuantityStepper";
import { useCart } from "../../../data/useCart";
import { buildWhatsAppMessage, cartTotal } from "../../../data/cart";
import { whatsappLink } from "../../../config/site";

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
    const navigate = useNavigate();
    const { items, setQuantity, removeItem, clear } = useCart();
    const total = cartTotal(items);

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
            <Box sx={{ width: { xs: "100vw", sm: 380 }, display: "flex", flexDirection: "column", height: "100%" }}>
                <Stack
                    direction="row"
                    sx={{ alignItems: "center", justifyContent: "space-between", p: 2 }}
                >
                    <Typography variant="h6">Your Cart</Typography>
                    <IconButton onClick={onClose} aria-label="Close cart">
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Divider />

                {items.length === 0 ? (
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                        <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                            Your cart is empty — add a product to get started.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                        {items.map((item) => (
                            <Stack key={item.key} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <Avatar src={item.image} variant="rounded" sx={{ width: 56, height: 56, bgcolor: "success.light" }}>
                                    {item.name.charAt(0)}
                                </Avatar>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography noWrap sx={{ fontWeight: 600 }}>
                                        {item.name}
                                    </Typography>
                                    {item.variantLabel && (
                                        <Typography variant="body2" color="text.secondary">
                                            {item.variantLabel}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                        ₹{item.price * item.quantity}
                                    </Typography>
                                </Box>

                                <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                                    <QuantityStepper
                                        value={item.quantity}
                                        onChange={(value) => setQuantity(item.key, value)}
                                    />
                                    <IconButton
                                        size="small"
                                        aria-label={`Remove ${item.name} from cart`}
                                        onClick={() => removeItem(item.key)}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {items.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
                                <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                                <Typography sx={{ fontWeight: 700 }} color="primary">
                                    ₹{total}
                                </Typography>
                            </Stack>

                            <CustomButton
                                variant="contained"
                                fullWidth
                                startIcon={<ShoppingCartCheckoutIcon />}
                                onClick={handleCheckout}
                                sx={{ mb: 1 }}
                            >
                                Checkout
                            </CustomButton>

                            <CustomButton
                                variant="outlined"
                                fullWidth
                                startIcon={<WhatsAppIcon />}
                                onClick={handleQuickWhatsAppOrder}
                                sx={{ mb: 1 }}
                            >
                                Order via WhatsApp
                            </CustomButton>

                            <Button fullWidth color="inherit" onClick={clear}>
                                Clear cart
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Drawer>
    );
};

export default CartDrawer;
