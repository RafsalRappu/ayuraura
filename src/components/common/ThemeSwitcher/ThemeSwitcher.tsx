import { useState } from "react";
import type { MouseEvent } from "react";
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { themePresets } from "../../../theme/presets";
import type { ThemePresetKey } from "../../../theme/presets";
import { useThemePreset } from "../../../theme/useThemePreset";

const presetKeys = Object.keys(themePresets) as ThemePresetKey[];

/** Primary-to-secondary swatch for a preset. */
const Swatch = ({ presetKey, size }: { presetKey: ThemePresetKey; size: number }) => {
    const { primary, secondary } = themePresets[presetKey].palette;

    return (
        <Box
            aria-hidden
            sx={{
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${primary.main} 0% 55%, ${secondary.main} 55% 100%)`,
                boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.background.paper}, 0 0 0 1px ${theme.palette.divider}`,
            }}
        />
    );
};

const ThemeSwitcher = () => {
    const { preset, setPreset } = useThemePreset();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleSelect = (key: ThemePresetKey) => {
        setPreset(key);
        handleClose();
    };

    return (
        <>
            <Tooltip title="Change theme color">
                <IconButton onClick={handleOpen} aria-label="Change theme color" sx={{ width: 42, height: 42 }}>
                    <Swatch presetKey={preset} size={20} />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Typography variant="overline" component="div" sx={{ px: 1.25, pt: 0.5, pb: 1, color: "text.secondary" }}>
                    Theme Color
                </Typography>

                {presetKeys.map((key) => {
                    const item = themePresets[key];
                    const active = key === preset;

                    return (
                        <MenuItem key={key} selected={active} onClick={() => handleSelect(key)} sx={{ minWidth: 210, gap: 1.5 }}>
                            <Swatch presetKey={key} size={22} />

                            <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: active ? 700 : 500 }}>
                                {item.label}
                            </Typography>

                            {active && (
                                <ListItemIcon sx={{ minWidth: "auto" }}>
                                    <CheckRoundedIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
};

export default ThemeSwitcher;
