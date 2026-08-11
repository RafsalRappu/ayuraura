const MAX_EDGE = 1400;
const QUALITY = 0.85;
const OUTPUT_TYPE = "image/jpeg";

const loadBitmap = async (file: File) => {
    if (typeof createImageBitmap === "function") {
        return createImageBitmap(file);
    }

    // Safari fallback: decode through an <img> element.
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * Scales a picked image down to web size before upload. Keeps product photos
 * inside the serverless body limit and off the critical path of page loads.
 * Returns the original file untouched if the browser cannot re-encode it.
 */
export const resizeImage = async (file: File): Promise<Blob> => {
    try {
        const source = await loadBitmap(file);
        const width = source.width;
        const height = source.height;

        if (!width || !height) return file;

        const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) return file;

        context.drawImage(source, 0, 0, targetWidth, targetHeight);
        if ("close" in source) source.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY)
        );

        // Only take the re-encode when it actually saved bytes.
        return blob && blob.size > 0 && blob.size < file.size ? blob : file;
    } catch {
        return file;
    }
};
