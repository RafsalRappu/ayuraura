import { getSql } from "./db.js";

/** Neon's free plan includes 0.5 GB per project; override with DB_STORAGE_LIMIT_MB on a bigger plan. */
const DEFAULT_LIMIT_MB = 512;

/** Share of the storage limit at which the admin can download an orders backup. */
export const BACKUP_THRESHOLD_PERCENT = 90;

export interface StorageStatus {
    usedBytes: number;
    limitBytes: number;
    /** 0–100+, one decimal. */
    percent: number;
    thresholdPercent: number;
    /** True once usage reaches the threshold — the only time a backup may be taken. */
    backupEnabled: boolean;
}

const resolveLimitBytes = () => {
    const configured = Number(process.env.DB_STORAGE_LIMIT_MB);
    const megabytes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_LIMIT_MB;
    return megabytes * 1024 * 1024;
};

export const getStorageStatus = async (): Promise<StorageStatus> => {
    const sql = getSql();
    const rows = (await sql`SELECT pg_database_size(current_database()) AS bytes`) as Array<{ bytes: string | number }>;

    const usedBytes = Number(rows[0]?.bytes ?? 0);
    const limitBytes = resolveLimitBytes();
    const percent = Math.round((usedBytes / limitBytes) * 1000) / 10;

    return {
        usedBytes,
        limitBytes,
        percent,
        thresholdPercent: BACKUP_THRESHOLD_PERCENT,
        backupEnabled: percent >= BACKUP_THRESHOLD_PERCENT,
    };
};
