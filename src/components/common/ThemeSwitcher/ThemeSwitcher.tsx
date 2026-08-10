import { useState } from "react";
import type { MouseEvent } from "react";
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";

import { themePresets } from "../../../theme/presets";
import type { ThemePresetKey } from "../../../theme/presets";
import { useThemePreset } from "../../../theme/useThemePreset";

const presetKeys = Object.keys(themePresets) as ThemePresetKey[];

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
                <IconButton
                    onClick={handleOpen}
                    aria-label="Change theme color"
                    sx={{ border: "1px solid rgba(0,0,0,0.12)" }}
                >
                    <PaletteOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <Typography variant="overline" sx={{ px: 2, color: "text.secondary" }}>
                    Theme Color
                </Typography>

                {presetKeys.map((key) => {
                    const item = themePresets[key];
                    const active = key === preset;

                    return (
                        <MenuItem key={key} onClick={() => handleSelect(key)} sx={{ minWidth: 200 }}>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: item.palette.primary.main,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    mr: 1.5,
                                    flexShrink: 0,
                                }}
                            />

                            <Typography sx={{ flexGrow: 1 }}>{item.label}</Typography>

                            {active && (
                                <ListItemIcon sx={{ minWidth: "auto" }}>
                                    <CheckIcon fontSize="small" color="primary" />
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
