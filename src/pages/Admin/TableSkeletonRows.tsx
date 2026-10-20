import { Box, Skeleton, TableCell, TableRow } from "@mui/material";

/** Shape of a placeholder cell, matched to what the real column shows. */
export type SkeletonColumn = "text" | "short" | "number" | "chip" | "image" | "actions";

interface TableSkeletonRowsProps {
    columns: SkeletonColumn[];
    rows?: number;
}

// Varied widths so the placeholder rows don't look like a uniform grid.
const textWidths = ["70%", "55%", "80%", "60%", "75%"];

const renderCell = (column: SkeletonColumn, row: number) => {
    switch (column) {
        case "image":
            return <Skeleton variant="rounded" width={48} height={48} />;
        case "chip":
            return <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 4 }} />;
        case "number":
            return <Skeleton variant="text" width={40} sx={{ ml: "auto" }} />;
        case "short":
            return <Skeleton variant="text" width={80} />;
        case "actions":
            return (
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                </Box>
            );
        default:
            return <Skeleton variant="text" width={textWidths[row % textWidths.length]} />;
    }
};

const TableSkeletonRows = ({ columns, rows = 5 }: TableSkeletonRowsProps) => (
    <>
        {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row} aria-hidden>
                {columns.map((column, index) => (
                    <TableCell key={index}>{renderCell(column, row)}</TableCell>
                ))}
            </TableRow>
        ))}
    </>
);

export default TableSkeletonRows;
