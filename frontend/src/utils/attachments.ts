import { api } from "../services/api";

export type AttachmentLike = {
  url?: string;
  name?: string;
  type?: "image" | "video" | "file";
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
};

const fallbackName = "attachment";
const officeExtensions = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

const getApiBaseUrl = () => {
  let baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL || "";

  if (!baseUrl) {
    console.warn("API base URL is not configured.");
    return "";
  }

  return baseUrl.replace(/\/$/, "");
};

export const getAttachmentName = (attachment?: AttachmentLike | null) => {
  if (!attachment) return fallbackName;
  if (attachment.name?.trim()) return attachment.name.trim();
  if (!attachment.url) return fallbackName;

  try {
    const pathname = new URL(attachment.url).pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(lastSegment || fallbackName);
  } catch {
    return attachment.url.split("/").filter(Boolean).pop() || fallbackName;
  }
};

export const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

export const getAttachmentExtension = (attachment?: AttachmentLike | null) => {
  const name = getAttachmentName(attachment);
  return name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
};

export const getDownloadUrl = (url: string, name?: string, disposition: "attachment" | "inline" = "attachment") => {
  const params = new URLSearchParams({ url });
  if (name) params.set("name", name);
  params.set("disposition", disposition);
  return `${getApiBaseUrl()}/api/upload/download?${params.toString()}`;
};

export const getAttachmentOpenUrl = (attachment: AttachmentLike) => {
  if (!attachment.url) return "";
  if (attachment.url.startsWith("blob:")) return attachment.url;

  const sourceUrl = attachment.downloadUrl || attachment.url;
  const extension = getAttachmentExtension(attachment);

  if (officeExtensions.has(extension) && /^https?:\/\//i.test(sourceUrl)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(sourceUrl)}&embedded=false`;
  }

  return getDownloadUrl(sourceUrl, getAttachmentName(attachment), "inline");
};

export const openAttachment = (attachment: AttachmentLike) => {
  const openUrl = getAttachmentOpenUrl(attachment);
  if (!openUrl) return false;

  const opened = window.open(openUrl, "_blank", "noopener,noreferrer");
  return Boolean(opened);
};

export const createAttachmentBlobUrl = async (attachment: AttachmentLike) => {
  if (!attachment.url) throw new Error("Attachment URL is missing");
  if (attachment.url.startsWith("blob:")) return attachment.url;

  const response = await fetch(getDownloadUrl(attachment.downloadUrl || attachment.url, getAttachmentName(attachment)));
  if (!response.ok) throw new Error("Attachment download failed");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const downloadAttachmentByUrl = (attachment: AttachmentLike) => {
  if (!attachment.url) return;
  const anchor = document.createElement("a");
  anchor.href = attachment.url.startsWith("blob:")
    ? attachment.url
    : getDownloadUrl(attachment.downloadUrl || attachment.url, getAttachmentName(attachment), "attachment");
  anchor.download = getAttachmentName(attachment);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const downloadBlobUrl = (blobUrl: string, name: string) => {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = name || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
