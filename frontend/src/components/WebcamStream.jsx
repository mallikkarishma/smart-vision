import { useRef, useEffect, useState } from "react";
import useWebcam from "../hooks/useWebcam";

const WebcamStream = () => {
  const { videoRef, isStreaming, faces, startWebcam, stopWebcam } = useWebcam();
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const frameTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = 640 / 320;
    const scaleY = 480 / 240;

    const now = Date.now();
    setFps(Math.round(1000 / (now - frameTimeRef.current)));
    frameTimeRef.current = now;

    faces.forEach((face) => {
      const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";
      const isDetecting = face.name === "Detecting...";
      const color = isKnown ? "#2dd4bf" : isDetecting ? "#fbbf24" : "#f87171";

      const x = face.x * scaleX;
      const y = face.y * scaleY;
      const w = face.width * scaleX;
      const h = face.height * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.stroke();

      const label = face.name || "Unknown";
      ctx.font = "500 11px 'Inter', sans-serif";
      const textW = ctx.measureText(label).width + 14;
      ctx.fillStyle = color + "18";
      ctx.beginPath();
      ctx.roundRect(x, y - 22, textW, 18, 4);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(label, x + 7, y - 9);
    });
  }, [faces]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f8fa",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#1a1a2e",
    }}>
      {/* Navbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #eef0f3",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#0f172a",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13,
          }}>
            👁️
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.2 }}>Smart Vision</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: isStreaming ? "#0d9488" : "#94a3b8",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isStreaming ? "#0d9488" : "#cbd5e1",
              display: "inline-block",
            }}/>
            {isStreaming ? `Live · ${fps} fps` : "Offline"}
          </span>
          <div style={{ width: 1, height: 16, background: "#eef0f3" }}/>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {faces.length} face{faces.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "28px 24px",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
      }}>
        {/* Video card */}
        <div style={{ flex: 1 }}>
          <div style={{
            borderRadius: 12,
            overflow: "hidden",
            background: "#0f172a",
            position: "relative",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", display: "block" }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={startWebcam}
              disabled={isStreaming}
              style={{
                flex: 1, padding: "9px 0",
                background: isStreaming ? "#f1f5f9" : "#0f172a",
                color: isStreaming ? "#cbd5e1" : "#fff",
                border: "none", borderRadius: 8,
                fontWeight: 600, fontSize: 13,
                cursor: isStreaming ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Start
            </button>
            <button
              onClick={stopWebcam}
              disabled={!isStreaming}
              style={{
                flex: 1, padding: "9px 0",
                background: !isStreaming ? "#f1f5f9" : "#fff",
                color: !isStreaming ? "#cbd5e1" : "#1a1a2e",
                border: `1px solid ${!isStreaming ? "transparent" : "#eef0f3"}`,
                borderRadius: 8,
                fontWeight: 600, fontSize: 13,
                cursor: !isStreaming ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Stop
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          width: 200,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #eef0f3",
          padding: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <p style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: 1.5, color: "#94a3b8",
            textTransform: "uppercase", margin: "0 0 12px",
          }}>
            In Frame
          </p>

          {faces.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#cbd5e1", fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🫥</div>
              No faces
            </div>
          ) : (
            faces.map((face, i) => {
              const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";
              const isDetecting = face.name === "Detecting...";
              const color = isKnown ? "#0d9488" : isDetecting ? "#d97706" : "#dc2626";
              return (
                <div key={i} style={{
                  padding: "8px 10px", marginBottom: 6,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #eef0f3",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: color, flexShrink: 0,
                    }}/>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>
                      {face.name || "Unknown"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamStream;