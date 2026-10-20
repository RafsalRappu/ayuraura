import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CircularProgress,
    LinearProgress,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";

import { fetchStorage } from "../../api/admin";
import type { StorageStatus } from "../../api/admin";
import { errorMessage } from "../../api/client";
import OrderBackupViewer from "./OrderBackupViewer";
import { downloadOrdersBackup } from "./orderBackup";

const formatBytes = (bytes: number) => {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** Database usage, plus the orders backup download that unlocks near the storage limit. */
const StorageBackupCard = () => {
    const [storage, setStorage] = useState<StorageStatus | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [exported, setExported] = useState<number | null>(null);
    const [backupError, setBackupError] = useState<string | null>(null);
    const [backupDone, setBackupDone] = useState<number | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    const backingUp = exported !== null;

    const load = useCallback(async () => {
        try {
            setStorage(await fetchStorage());
            setLoadError(null);
        } catch (error) {
            setLoadError(errorMessage(error, "Could not read database storage."));
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleBackup = async () => {
        setExported(0);
        setBackupError(null);
        setBackupDone(null);
        try {
            setBackupDone(await downloadOrdersBackup(setExported));
        } catch (error) {
            setBackupError(errorMessage(error, "Could not create the backup."));
        } finally {
            setExported(null);
            void load();
        }
    };

    const percent = storage?.percent ?? 0;
    const barColor = !storage ? "primary" : storage.backupEnabled ? "error" : percent >= 75 ? "warning" : "primary";

    return (
        <Card variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 3 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 2, md: 4 }}
                sx={{ alignItems: { md: "center" } }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                        <StorageOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Database storage
                        </Typography>
                    </Stack>

                    {storage ? (
                        <>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="body2">
                                    {formatBytes(storage.usedBytes)} of {formatBytes(storage.limitBytes)}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {storage.percent}%
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(percent, 100)}
                                color={barColor}
                                aria-label="Database storage used"
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                                {storage.backupEnabled
                                    ? "Storage is nearly full — download an orders backup."
                                    : `Orders backup unlocks at ${storage.thresholdPercent}% usage.`}
                            </Typography>
                        </>
                    ) : loadError ? (
                        <Typography variant="body2" color="error">
                            {loadError}
                        </Typography>
                    ) : (
                        <>
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="rounded" height={8} />
                            <Skeleton variant="text" width="55%" />
                        </>
                    )}
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5, flexShrink: 0 }}>
                    <Tooltip
                        title={
                            storage && !storage.backupEnabled
                                ? `Available once storage reaches ${storage.thresholdPercent}% (now ${storage.percent}%).`
                                : ""
                        }
                    >
                        {/* span: a disabled button swallows the pointer events the tooltip needs */}
                        <span>
                            <Button
                                variant="contained"
                                onClick={() => void handleBackup()}
                                disabled={!storage?.backupEnabled || backingUp}
                                startIcon={
                                    backingUp ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />
                                }
                                sx={{ borderRadius: 3, boxShadow: "none" }}
                            >
                                {backingUp ? `Exporting… ${exported}` : "Backup orders"}
                            </Button>
                        </span>
                    </Tooltip>

                    <Button
                        variant="outlined"
                        startIcon={<FolderOpenOutlinedIcon />}
                        onClick={() => setViewerOpen(true)}
                        sx={{ borderRadius: 3 }}
                    >
                        Open backup file
                    </Button>
                </Stack>
            </Stack>

            {backupError && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setBackupError(null)}>
                    {backupError}
                </Alert>
            )}
            {backupDone !== null && (
                <Alert severity="success" sx={{ mt: 2 }} onClose={() => setBackupDone(null)}>
                    Backup saved — {backupDone} order{backupDone === 1 ? "" : "s"} exported to a CSV file in your downloads.
                    Keep it somewhere safe; it contains customer details.
                </Alert>
            )}

            <OrderBackupViewer open={viewerOpen} onClose={() => setViewerOpen(false)} />
        </Card>
    );
};

export default StorageBackupCard;
