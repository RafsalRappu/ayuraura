import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
    Tooltip,
    Typography,
} from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { errorMessage } from "../../api/client";
import { changeAdminPassword, createAdmin, deleteAdmin, fetchAdmins, updateAdmin } from "../../api/admin";
import type { AdminAccount } from "../../api/admin";
import TableSkeletonRows from "./TableSkeletonRows";

const PASSWORD_MIN = 8;

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

const PasswordField = (props: TextFieldProps) => {
    const [shown, setShown] = useState(false);
    return (
        <TextField
            {...props}
            type={shown ? "text" : "password"}
            fullWidth
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={shown ? "Hide password" : "Show password"}
                                onClick={() => setShown((value) => !value)}
                                onMouseDown={(event) => event.preventDefault()}
                                edge="end"
                            >
                                {shown ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

type ProfileDialog = { mode: "add" } | { mode: "edit"; admin: AdminAccount };

interface AdminAdminsProps {
    currentAdmin: AdminAccount;
    /** Called when you edit your own account, so the sidebar shows the new name. */
    onSelfUpdated: (admin: AdminAccount) => void;
}

const AdminAdmins = ({ currentAdmin, onSelfUpdated }: AdminAdminsProps) => {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [profileDialog, setProfileDialog] = useState<ProfileDialog | null>(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");

    const [passwordTarget, setPasswordTarget] = useState<AdminAccount | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setAdmins(await fetchAdmins());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load admins."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const resetPasswords = () => {
        setCurrentPassword("");
        setPassword("");
        setConfirm("");
    };

    const openAdd = () => {
        setProfileDialog({ mode: "add" });
        setName("");
        setUsername("");
        resetPasswords();
        setSaveError(null);
    };

    const openEdit = (admin: AdminAccount) => {
        setProfileDialog({ mode: "edit", admin });
        setName(admin.name);
        setUsername(admin.username);
        setSaveError(null);
    };

    const openPassword = (admin: AdminAccount) => {
        setPasswordTarget(admin);
        resetPasswords();
        setSaveError(null);
    };

    const closeDialogs = () => {
        if (saving) return;
        setProfileDialog(null);
        setPasswordTarget(null);
    };

    const passwordProblem =
        password.length > 0 && password.length < PASSWORD_MIN
            ? `At least ${PASSWORD_MIN} characters.`
            : confirm.length > 0 && confirm !== password
              ? "Passwords don't match."
              : null;
    const passwordReady = password.length >= PASSWORD_MIN && confirm === password;

    const handleSaveProfile = async () => {
        if (!profileDialog) return;
        setSaving(true);
        setSaveError(null);
        try {
            if (profileDialog.mode === "add") {
                const created = await createAdmin({ name: name.trim(), username: username.trim(), password });
                setAdmins((current) => [...current, created]);
                setNotice(`Added ${created.name}. They can sign in with the username "${created.username}".`);
            } else {
                const updated = await updateAdmin(profileDialog.admin.id, { name: name.trim(), username: username.trim() });
                setAdmins((current) => current.map((a) => (a.id === updated.id ? updated : a)));
                if (updated.id === currentAdmin.id) onSelfUpdated(updated);
                setNotice(`Saved ${updated.name}.`);
            }
            setProfileDialog(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not save this admin."));
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!passwordTarget) return;
        const isSelf = passwordTarget.id === currentAdmin.id;
        setSaving(true);
        setSaveError(null);
        try {
            await changeAdminPassword(passwordTarget.id, password, isSelf ? currentPassword : undefined);
            setNotice(
                isSelf
                    ? "Your password was changed. Other devices you were signed in on have been signed out."
                    : `Password changed for ${passwordTarget.name}. They've been signed out everywhere.`
            );
            setPasswordTarget(null);
            resetPasswords();
        } catch (error) {
            setSaveError(errorMessage(error, "Could not change the password."));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (admin: AdminAccount) => {
        if (!window.confirm(`Delete the admin "${admin.name}" (${admin.username})? They will lose access immediately.`)) return;

        setDeletingId(admin.id);
        setLoadError(null);
        try {
            await deleteAdmin(admin.id);
            setAdmins((current) => current.filter((a) => a.id !== admin.id));
            setNotice(`Deleted ${admin.name}.`);
        } catch (error) {
            setLoadError(errorMessage(error, "Could not delete this admin."));
        } finally {
            setDeletingId(null);
        }
    };

    const deleteBlockedReason = (admin: AdminAccount) => {
        if (admins.length <= 1) return "The last admin can't be deleted";
        if (admin.id === currentAdmin.id) return "You can't delete your own account";
        return null;
    };

    const isSelfPassword = passwordTarget?.id === currentAdmin.id;
    const profileReady = name.trim().length > 0 && username.trim().length >= 3;

    return (
        <Box>
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}
            >
                <Box>
                    <Typography variant="h5" component="h1">
                        Admins
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? <Skeleton variant="text" width={100} /> : `${admins.length} admin${admins.length === 1 ? "" : "s"}`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={openAdd}>
                        Add admin
                    </Button>
                </Stack>
            </Stack>

            {notice && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setNotice(null)}>
                    {notice}
                </Alert>
            )}

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Admin</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Added</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading && <TableSkeletonRows columns={["text", "short", "short", "actions"]} rows={3} />}

                        {!loading &&
                            admins.map((admin) => {
                                const isSelf = admin.id === currentAdmin.id;
                                const blocked = deleteBlockedReason(admin);

                                return (
                                    <TableRow key={admin.id} hover>
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
                                                    {initials(admin.name)}
                                                </Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {admin.name}
                                                </Typography>
                                                {isSelf && <Chip label="You" size="small" color="primary" />}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ color: "text.secondary" }}>{admin.username}</TableCell>
                                        <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                            <Tooltip title="Edit name and username">
                                                <IconButton size="small" onClick={() => openEdit(admin)}>
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Change password">
                                                <IconButton size="small" onClick={() => openPassword(admin)}>
                                                    <KeyOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={blocked ?? "Delete admin"}>
                                                {/* span: a disabled button fires no events, so the tooltip needs a wrapper */}
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        aria-label={`Delete ${admin.name}`}
                                                        disabled={blocked !== null || deletingId !== null}
                                                        onClick={() => void handleDelete(admin)}
                                                    >
                                                        {deletingId === admin.id ? (
                                                            <CircularProgress size={18} />
                                                        ) : (
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add / edit */}
            <Dialog open={profileDialog !== null} onClose={closeDialogs} maxWidth="xs" fullWidth>
                <DialogTitle>{profileDialog?.mode === "add" ? "Add admin" : "Edit admin"}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5}>
                        {saveError && (
                            <Alert severity="error" onClose={() => setSaveError(null)}>
                                {saveError}
                            </Alert>
                        )}
                        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth autoFocus />
                        <TextField
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            required
                            fullWidth
                            helperText="Used to sign in. Lowercase letters, numbers, dots, dashes or underscores."
                            slotProps={{ htmlInput: { autoCapitalize: "none", spellCheck: false } }}
                        />
                        {profileDialog?.mode === "add" && (
                            <>
                                <PasswordField
                                    label="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    helperText={`At least ${PASSWORD_MIN} characters.`}
                                />
                                <PasswordField
                                    label="Confirm password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    error={passwordProblem !== null}
                                    helperText={passwordProblem ?? " "}
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button color="inherit" onClick={closeDialogs} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => void handleSaveProfile()}
                        disabled={saving || !profileReady || (profileDialog?.mode === "add" && !passwordReady)}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        {profileDialog?.mode === "add" ? "Add admin" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change password */}
            <Dialog open={passwordTarget !== null} onClose={closeDialogs} maxWidth="xs" fullWidth>
                <DialogTitle>{isSelfPassword ? "Change your password" : `Change password for ${passwordTarget?.name ?? ""}`}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5}>
                        {saveError && (
                            <Alert severity="error" onClose={() => setSaveError(null)}>
                                {saveError}
                            </Alert>
                        )}
                        {!isSelfPassword && (
                            <Typography variant="body2" color="text.secondary">
                                They'll be signed out everywhere and will need the new password to sign in.
                            </Typography>
                        )}
                        {isSelfPassword && (
                            <PasswordField
                                label="Current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoFocus
                                autoComplete="current-password"
                            />
                        )}
                        <PasswordField
                            label="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus={!isSelfPassword}
                            autoComplete="new-password"
                            helperText={`At least ${PASSWORD_MIN} characters.`}
                        />
                        <PasswordField
                            label="Confirm new password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                            error={passwordProblem !== null}
                            helperText={passwordProblem ?? " "}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button color="inherit" onClick={closeDialogs} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => void handleSavePassword()}
                        disabled={saving || !passwordReady || (isSelfPassword && !currentPassword)}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        Change password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminAdmins;
