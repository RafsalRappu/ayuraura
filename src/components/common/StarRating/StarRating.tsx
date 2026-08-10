import { Box, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarOutlineIcon from "@mui/icons-material/StarOutlined";

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
            <Box sx={{ display: "flex", color: "#D9A441" }} aria-hidden="true">
                {Array.from({ length: fullStars }).map((_, i) => (
                    <StarIcon key={`full-${i}`} sx={{ fontSize: size }} />
                ))}
                {hasHalfStar && <StarHalfIcon sx={{ fontSize: size }} />}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <StarOutlineIcon key={`empty-${i}`} sx={{ fontSize: size }} />
                ))}
            </Box>

            {reviewCount !== undefined && (
                <Typography variant="body2" color="text.secondary">
                    {value.toFixed(1)} ({reviewCount})
                </Typography>
            )}
        </Box>
    );
};

export default StarRating;
