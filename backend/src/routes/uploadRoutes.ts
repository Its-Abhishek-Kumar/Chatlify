import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads/chat-files");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const encodeContentDispositionName = (name: string) => {
  const safeFallback = name.replace(/[^\w.-]/g, "_") || "attachment";
  return `attachment; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

const encodeInlineDispositionName = (name: string) => {
  const safeFallback = name.replace(/[^\w.-]/g, "_") || "attachment";
  return `inline; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

const sanitizeFileName = (name: string) => {
  const clean = name.replace(/[^\w .()-]/g, "_").trim();
  return clean || "attachment";
};

const getMimeFromName = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".zip": "application/zip",
  };
  return map[ext] || "application/octet-stream";
};

const isCloudinaryUrl = (url: URL) => url.hostname.includes("res.cloudinary.com");

const cloudinaryRawCandidate = (url: URL) => {
  if (!isCloudinaryUrl(url)) return "";
  const candidate = new URL(url.toString());
  candidate.pathname = candidate.pathname
    .replace("/image/upload/", "/raw/upload/")
    .replace("/video/upload/", "/raw/upload/");
  return candidate.toString();
};

const fetchFirstAvailable = async (urls: string[]) => {
  let lastResponse: Response | null = null;
  for (const url of Array.from(new Set(urls.filter(Boolean)))) {
    const response = await fetch(url);
    if (response.ok) return response;
    lastResponse = response;
  }
  return lastResponse;
};

router.post("/", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const shouldUseCloudinary = req.file.mimetype.startsWith("image/") || req.file.mimetype.startsWith("video/");

    if (!shouldUseCloudinary) {
      await fs.mkdir(uploadsDir, { recursive: true });

      const originalName = sanitizeFileName(req.file.originalname);
      const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${originalName}`;
      const storedPath = path.join(uploadsDir, storedName);
      await fs.writeFile(storedPath, req.file.buffer);

      const publicUrl = `${req.protocol}://${req.get("host")}/api/upload/file/${encodeURIComponent(storedName)}`;

      return res.json({
        url: publicUrl,
        downloadUrl: publicUrl,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype || getMimeFromName(req.file.originalname),
        resourceType: "local",
      });
    }

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chat-app",
            resource_type: req.file.mimetype.startsWith("image/") ? "image" : "video",
            type: "upload",
            access_mode: "public",
            use_filename: true,
            unique_filename: true,
            filename_override: req.file.originalname,
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result: any = await streamUpload();

    res.json({
      url: result.secure_url,
      downloadUrl: result.secure_url,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      resourceType: result.resource_type,
      format: result.format,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Upload failed",
    });
  }
});

router.get("/file/:storedName", async (req: any, res) => {
  try {
    const storedName = path.basename(decodeURIComponent(req.params.storedName || ""));
    const filePath = path.join(uploadsDir, storedName);
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return res.status(404).json({ message: "File not found" });
    }

    const originalName = storedName.split("-").slice(2).join("-") || storedName;
    const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";
    const contentType = getMimeFromName(originalName);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);
    res.setHeader(
      "Content-Disposition",
      disposition === "attachment" ? encodeContentDispositionName(originalName) : encodeInlineDispositionName(originalName),
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(filePath);
  } catch (err) {
    console.error("Local file delivery error:", err);
    res.status(404).json({ message: "File not found" });
  }
});

router.get("/download", async (req: any, res) => {
  const fileUrl = typeof req.query.url === "string" ? req.query.url : "";
  const requestedName = typeof req.query.name === "string" ? req.query.name : "";
  const disposition = req.query.disposition === "inline" ? "inline" : "attachment";
  if (!fileUrl) {
    return res.status(400).json({ message: "URL parameter is required" });
  }

  try {
    const parsedUrl = new URL(fileUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ message: "Only HTTP(S) file URLs are supported" });
    }

    const fetchResponse = await fetchFirstAvailable([
      fileUrl,
      cloudinaryRawCandidate(parsedUrl),
    ]);

    if (!fetchResponse) {
      return res.status(404).json({ message: "File source not found" });
    }

    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ message: "Failed to fetch file from source" });
    }

    const contentType = fetchResponse.headers.get("content-type") || "application/octet-stream";
    const contentLength = fetchResponse.headers.get("content-length");
    const fallbackName = decodeURIComponent(parsedUrl.pathname.split("/").filter(Boolean).pop() || "attachment");
    const fileName = requestedName.trim() || fallbackName;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", disposition === "inline" ? encodeInlineDispositionName(fileName) : encodeContentDispositionName(fileName));
    res.setHeader("Cache-Control", "private, max-age=300");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    
    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err) {
    console.error("Download proxy error:", err);
    res.status(500).json({ message: "Failed to proxy download file" });
  }
});

export default router;
