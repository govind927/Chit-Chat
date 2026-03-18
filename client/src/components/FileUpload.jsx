import { useState, useRef } from "react";
import axiosClient from "../api/axiosClient.js";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload = ({ onUpload, onClose }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    setError("");
    if (file.size > MAX_SIZE) {
      setError("File too large (max 10MB)");
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ url: e.target.result, name: file.name, type: "image" });
      reader.readAsDataURL(file);
    } else {
      setPreview({ name: file.name, type: "file", size: file.size });
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpload(res.data);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div style={{
      position: "absolute",
      bottom: "100%",
      left: 0,
      zIndex: 200,
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 16,
      width: 300,
      boxShadow: "var(--shadow)",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Share file</span>
        <button className="button ghost icon" onClick={onClose} style={{ padding: "2px 6px" }}>✕</button>
      </div>

      {!preview ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--accent)" : "var(--border-strong)"}`,
            borderRadius: 12,
            padding: "28px 16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.2s, background 0.2s",
            background: dragging ? "var(--border)" : "transparent",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Drop file here or click to browse
          </div>
          <div style={{ fontSize: 11, color: "var(--muted-soft)", marginTop: 4 }}>
            Images, videos, PDFs, docs (max 10MB)
          </div>
        </div>
      ) : (
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}>
          {preview.type === "image" ? (
            <img src={preview.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              📄
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {preview.name}
            </div>
            {preview.size && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{formatSize(preview.size)}</div>
            )}
          </div>
          {uploading && <div style={{ fontSize: 12, color: "var(--accent)" }} className="pulse">Uploading…</div>}
        </div>
      )}

      {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
};

export default FileUpload;
