import { fetchBackupPage } from "../../api/admin";
import type { AdminOrder } from "../../types/order";
import { ordersToCsv } from "./orderCsv";

const backupFilename = () => `ayuaura-orders-backup-${new Date().toISOString().slice(0, 10)}.csv`;

/**
 * Walks every page of orders from the server, saves them as one CSV through
 * the browser's download, and resolves with how many orders were written.
 */
export const downloadOrdersBackup = async (onProgress?: (exported: number) => void) => {
    const orders: AdminOrder[] = [];
    let after = 0;

    for (;;) {
        const page = await fetchBackupPage(after);
        orders.push(...page.orders);
        onProgress?.(orders.length);
        if (page.nextAfter === null) break;
        after = page.nextAfter;
    }

    // The BOM makes Excel read the file as UTF-8, so ₹ and non-English names survive.
    const blob = new Blob(["﻿", ordersToCsv(orders)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return orders.length;
};
