import { useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import { orderShortCode } from "../../data/cart";
import type { OrderStatus } from "../../types/order";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "./adminTypes";
import { parseBackupCsv } from "./orderCsv";
import type { BackupRow } from "./orderCsv";

interface OrderBackupViewerProps {
    open: boolean;
    onClose: () => void;
}

const isStatus = (value: string): value is OrderStatus => value in ORDER_STATUS_LABEL;

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

/**
 * Read-only look inside a downloaded orders backup. The file is parsed in the
 * browser and never uploaded, and nothing here touches the live database.
 */
const OrderBackupViewer = ({ open, onClose }: OrderBackupViewerProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [fileName, setFileName] = useState<string | null>(null);
    const [rows, setRows] = useState<BackupRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const handleFile = async (file: File | undefined) => {
        if (!file) return;

        setError(null);
        setQuery("");
        try {
            setRows(parseBackupCsv(await file.text()));
            setFileName(file.name);
        } catch (cause) {
            setRows([]);
            setFileName(null);
            setError(cause instanceof Error ? cause.message : "Could not read this file.");
        }
    };

    const handleClose = () => {
        onClose();
        setRows([]);
        setFileName(null);
        setError(null);
        setQuery("");
    };

    const visibleRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            [row.order_id, row.customer_name, row.customer_phone, row.items, row.status]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, query]);

    const paidRevenue = useMemo(
        () => rows.filter((row) => row.status === "paid").reduce((total, row) => total + (Number(row.amount) || 0), 0),
        [rows]
    );

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
            <DialogTitle>Orders backup</DialogTitle>

            <DialogContent>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    hidden
                    onChange={(event) => {
                        void handleFile(event.target.files?.[0]);
                        // Lets the same file be picked again after closing and reopening.
                        event.target.value = "";
                    }}
                />

                <Stack
                    direction="row"
                    sx={{ alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 2 }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<UploadFileOutlinedIcon />}
                        onClick={() => inputRef.current?.click()}
                        sx={{ borderRadius: 3 }}
                    >
                        {fileName ? "Choose another file" : "Choose backup file"}
                    </Button>

                    {fileName && (
                        <Typography variant="body2" color="text.secondary">
                            {fileName} · {rows.length} order{rows.length === 1 ? "" : "s"} · ₹{paidRevenue} paid
                        </Typography>
                    )}
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {!fileName && !error && (
                    <Box sx={{ textAlign: "center", color: "text.secondary", py: 6 }}>
                        <Typography variant="body2">
                            Choose a backup file (.csv) you downloaded earlier to look through its orders. It is read in
                            your browser only — nothing is uploaded or changed.
                        </Typography>
                    </Box>
                )}

                {fileName && (
                    <>
                        <TextField
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by customer, phone, item or order #…"
                            size="small"
                            fullWidth
                            sx={{ mb: 2 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, maxHeight: "55vh" }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order</TableCell>
                                        <TableCell>Placed</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Items</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {visibleRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                                                {rows.length === 0 ? "This backup has no orders." : "No orders match your search."}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {visibleRows.map((row, index) => (
                                        <TableRow key={`${row.order_id}-${index}`} hover>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>#{orderShortCode(row.order_id)}</TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.placed_at)}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{row.customer_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.customer_phone}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 200 }}>{row.items}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                                ₹{row.amount}
                                            </TableCell>
                                            <TableCell>
                                                {isStatus(row.status) ? (
                                                    <Chip
                                                        label={ORDER_STATUS_LABEL[row.status]}
                                                        color={ORDER_STATUS_COLOR[row.status]}
                                                        size="small"
                                                    />
                                                ) : (
                                                    row.status
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderBackupViewer;
