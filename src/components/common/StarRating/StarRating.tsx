import { Box, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarHalfRoundedIcon from "@mui/icons-material/StarHalfRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";

interface StarRatingProps {
    value: number;
    reviewCount?: number;
    size?: number;
}

const StarRating = ({ value, reviewCount, size = 18 }: StarRatingProps) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
            aria-label={`Rated ${value} out of 5${reviewCount ? ` from ${reviewCount} reviews` : ""}`}
        >
            <Box sx={{ display: "flex", color: "warning.main" }} aria-hidden="true">
                {Array.from({ length: fullStars }).map((_, i) => (
                    <StarRoundedIcon key={`full-${i}`} sx={{ fontSize: size }} />
                ))}
                {hasHalfStar && <StarHalfRoundedIcon sx={{ fontSize: size }} />}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <StarOutlineRoundedIcon key={`empty-${i}`} sx={{ fontSize: size, color: "text.disabled" }} />
                ))}
            </Box>

            {reviewCount !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {value.toFixed(1)}{" "}
                    <Box component="span" sx={{ color: "text.disabled" }}>
                        ({reviewCount})
                    </Box>
                </Typography>
            )}
        </Box>
    );
};

export default StarRating;
