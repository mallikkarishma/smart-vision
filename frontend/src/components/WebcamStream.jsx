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

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Corner brackets
      const cs = 14;
      ctx.lineWidth = 3;
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy], i) => {
        ctx.beginPath();
        ctx.moveTo(cx + (i % 2 === 0 ? cs : -cs), cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + (i < 2 ? cs : -cs));
        ctx.stroke();
      });

      // Badge
      const label = face.name || "Unknown";
      ctx.font = "600 12px 'Segoe UI', sans-serif";
      const textW = ctx.measureText(label).width + 18;
      ctx.fillStyle = color + "25";
      ctx.beginPath();
      ctx.roundRect(x, y - 26, textW, 20, 5);
      ctx.fill();
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y - 26, textW, 20, 5);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, x + 9, y - 12);
    });
  }, [faces]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a1a16",
      color: "#e2f5f0",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Navbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 32px",
        background: "#0d1f1a",
        borderBottom: "0.5px solid rgba(45,212,191,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #2dd4bf, #34d399)",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16,
          }}>
            👁️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Smart Vision</div>
            <div style={{ fontSize: 11, color: "#2a5a50" }}>Face Recognition Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{
            padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isStreaming ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${isStreaming ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: isStreaming ? "#2dd4bf" : "#2a5a50",
          }}>
            {isStreaming ? `● LIVE  ${fps} fps` : "○ Offline"}
          </div>
          <div style={{
            padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: "rgba(52,211,153,0.08)",
            border: "0.5px solid rgba(52,211,153,0.2)",
            color: "#34d399",
          }}>
            {faces.length} face{faces.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: "flex", gap: "20px",
        padding: "24px 32px", alignItems: "flex-start",
      }}>
        {/* Video */}
        <div style={{ flex: 1 }}>
          <div style={{
            borderRadius: 16, overflow: "hidden",
            border: "0.5px solid rgba(45,212,191,0.12)",
            background: "#071210",
            boxShadow: isStreaming ? "0 0 32px rgba(45,212,191,0.08)" : "none",
            position: "relative",
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", display: "block", background: "#050e0b" }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: 14 }}>
            <button
              onClick={startWebcam}
              disabled={isStreaming}
              style={{
                flex: 1, padding: "11px",
                background: isStreaming
                  ? "rgba(255,255,255,0.03)"
                  : "linear-gradient(135deg, #2dd4bf, #34d399)",
                color: isStreaming ? "#1e4a40" : "#071210",
                border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 13,
                cursor: isStreaming ? "not-allowed" : "pointer",
                boxShadow: isStreaming ? "none" : "0 4px 16px rgba(45,212,191,0.25)",
              }}
            >
              Start Stream
            </button>
            <button
              onClick={stopWebcam}
              disabled={!isStreaming}
              style={{
                flex: 1, padding: "11px",
                background: "rgba(255,255,255,0.04)",
                color: !isStreaming ? "#1e4a40" : "#e2f5f0",
                border: `0.5px solid ${!isStreaming ? "transparent" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10,
                fontWeight: 600, fontSize: 13,
                cursor: !isStreaming ? "not-allowed" : "pointer",
              }}
            >
              Stop Stream
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          width: 220,
          background: "#071210",
          borderRadius: 16,
          border: "0.5px solid rgba(45,212,191,0.08)",
          padding: "16px",
          minHeight: 320,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: 2, color: "#1e4a40",
            marginBottom: 14, textTransform: "uppercase",
          }}>
            In Frame
          </div>

          {faces.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 60, color: "#1e4a40", fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🫥</div>
              No faces detected
            </div>
          ) : (
            faces.map((face, i) => {
              const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";
              const isDetecting = face.name === "Detecting...";
              const color = isKnown ? "#2dd4bf" : isDetecting ? "#fbbf24" : "#f87171";
              return (
                <div key={i} style={{
                  padding: "10px 12px", marginBottom: 8,
                  borderRadius: 10,
                  background: `${color}0d`,
                  border: `0.5px solid ${color}30`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: color, boxShadow: `0 0 5px ${color}`,
                    }}/>
                    <div style={{ fontSize: 13, fontWeight: 600, color }}>
                      {face.name || "Unknown"}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#1e4a40", marginTop: 4 }}>
                    {face.width}×{face.height}px
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