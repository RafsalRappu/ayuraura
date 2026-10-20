import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    InputAdornment,
    Paper,
    Skeleton,
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
import { alpha } from "@mui/material/styles";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { errorMessage } from "../../api/client";
import { fetchCustomers } from "../../api/admin";
import type { AdminCustomer } from "../../api/admin";
import TableSkeletonRows from "./TableSkeletonRows";

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

const AdminCustomers = () => {
    const [customers, setCustomers] = useState<AdminCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setCustomers(await fetchCustomers());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load users."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) =>
            [c.name, c.phone, c.email ?? ""].some((value) => value.toLowerCase().includes(q))
        );
    }, [customers, query]);

    return (
        <Box>
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}
            >
                <Box>
                    <Typography variant="h5" component="h1">
                        Users
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? (
                            <Skeleton variant="text" width={100} />
                        ) : (
                            `${customers.length} registered user${customers.length === 1 ? "" : "s"}`
                        )}
                    </Typography>
                </Box>

                <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                    Refresh
                </Button>
            </Stack>

            <TextField
                placeholder="Search by name, phone or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                size="small"
                sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
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

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="right">Orders</TableCell>
                            <TableCell align="right">Paid total</TableCell>
                            <TableCell>Joined</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading && <TableSkeletonRows columns={["text", "short", "text", "number", "number", "short"]} />}

                        {!loading && visible.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    <PeopleOutlineIcon sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {customers.length === 0 ? "No users have signed up yet." : "No users match your search."}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            visible.map((customer) => (
                                <TableRow key={customer.id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                            <Avatar
                                                sx={(theme) => ({
                                                    width: 34,
                                                    height: 34,
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: "primary.dark",
                                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                })}
                                            >
                                                {initials(customer.name)}
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {customer.name}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell sx={{ color: customer.email ? "text.primary" : "text.disabled" }}>
                                        {customer.email ?? "—"}
                                    </TableCell>
                                    <TableCell align="right">{customer.orderCount}</TableCell>
                                    <TableCell align="right">₹{customer.paidTotal}</TableCell>
                                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AdminCustomers;
