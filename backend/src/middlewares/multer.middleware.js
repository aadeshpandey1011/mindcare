import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "./public/temp";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // keep original extension, prefix with timestamp to avoid collisions
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ext);
    },
});

// ── Avatar / cover image uploads (images only) ────────────────────────────────
function imageOnlyFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
}

// ── Forum post media (images + videos) ───────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

function mediaFilter(req, file, cb) {
    if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, png, gif, webp) and videos (mp4, webm, mov, avi) are allowed"), false);
    }
}

// ── Exports ───────────────────────────────────────────────────────────────────
// Default upload (profile images etc.) — images only, 5 MB
export const upload = multer({
    storage,
    fileFilter: imageOnlyFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Forum media upload — images + videos, 50 MB per file, max 4 files
export const uploadMedia = multer({
    storage,
    fileFilter: mediaFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});
