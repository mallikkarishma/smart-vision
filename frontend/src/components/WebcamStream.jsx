import { useRef, useEffect, useState } from "react";
import useWebcam from "../hooks/useWebcam";
import AttendanceSidebar from "./AttendanceSidebar";

const FaceScanIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#7c3aed"/>
    <rect x="8" y="8" width="8" height="3" rx="1" fill="#ede9fe"/>
    <rect x="8" y="8" width="3" height="8" rx="1" fill="#ede9fe"/>
    <rect x="24" y="8" width="8" height="3" rx="1" fill="#ede9fe"/>
    <rect x="29" y="8" width="3" height="8" rx="1" fill="#ede9fe"/>
    <rect x="8" y="29" width="8" height="3" rx="1" fill="#ede9fe"/>
    <rect x="8" y="24" width="3" height="8" rx="1" fill="#ede9fe"/>
    <rect x="24" y="29" width="8" height="3" rx="1" fill="#ede9fe"/>
    <rect x="29" y="24" width="3" height="8" rx="1" fill="#ede9fe"/>
    <circle cx="20" cy="19" r="5" stroke="#ede9fe" strokeWidth="1.5" fill="none"/>
    <circle cx="20" cy="19" r="1.5" fill="#ede9fe"/>
  </svg>
);

const WebcamStream = () => {
  const { videoRef, isStreaming, faces, objects, startWebcam, stopWebcam } = useWebcam();
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

    // Draw face boxes
    faces.forEach((face) => {
      const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";
      const isDetecting = face.name === "Detecting...";
      const color = isKnown ? "#a78bfa" : isDetecting ? "#fbbf24" : "#f87171";

      const x = face.x * scaleX;
      const y = face.y * scaleY;
      const w = face.width * scaleX;
      const h = face.height * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();

      const cs = 12;
      ctx.lineWidth = 2.5;
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy], i) => {
        ctx.beginPath();
        ctx.moveTo(cx + (i % 2 === 0 ? cs : -cs), cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + (i < 2 ? cs : -cs));
        ctx.stroke();
      });

      const label = face.name || "Unknown";
      ctx.font = "600 11px 'Segoe UI', sans-serif";
      const textW = ctx.measureText(label).width + 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y - 22, textW, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#09060f";
      ctx.fillText(label, x + 7, y - 9);
    });

    // Draw YOLO object boxes
    objects.forEach((obj) => {
      const x = obj.x * scaleX;
      const y = obj.y * scaleY;
      const w = obj.width * scaleX;
      const h = obj.height * scaleY;

      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.stroke();

      const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
      ctx.font = "500 11px 'Segoe UI', sans-serif";
      const textW = ctx.measureText(label).width + 14;
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.roundRect(x, y - 22, textW, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#09060f";
      ctx.fillText(label, x + 7, y - 9);
    });

  }, [faces, objects]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#09060f",
      color: "#ede9fe",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Navbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: 54,
        background: "#0e0a18",
        borderBottom: "0.5px solid #1e1530",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaceScanIcon />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#ede9fe" }}>Smart Vision</div>
            <div style={{ fontSize: 10, color: "#4c3d6b" }}>Face Recognition Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: isStreaming ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${isStreaming ? "rgba(124,58,237,0.4)" : "#1e1530"}`,
            color: isStreaming ? "#a78bfa" : "#4c3d6b",
          }}>
            {isStreaming ? `● LIVE · ${fps} fps` : "○ Offline"}
          </div>
          <div style={{
            padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: "rgba(167,139,250,0.08)",
            border: "0.5px solid rgba(167,139,250,0.15)",
            color: "#7c3aed",
          }}>
            {faces.length} face{faces.length !== 1 ? "s" : ""}
          </div>
          <div style={{
            padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: "rgba(52,211,153,0.08)",
            border: "0.5px solid rgba(52,211,153,0.15)",
            color: "#34d399",
          }}>
            {objects.length} object{objects.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}>
        {/* Video */}
        <div style={{ flex: 1 }}>
          <div style={{
            borderRadius: 14,
            overflow: "hidden",
            background: "#0a0714",
            border: "0.5px solid #1e1530",
            position: "relative",
            boxShadow: isStreaming ? "0 0 28px rgba(124,58,237,0.08)" : "none",
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", display: "block", background: "#060410" }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={startWebcam}
              disabled={isStreaming}
              style={{
                flex: 1, padding: "10px",
                background: isStreaming ? "rgba(255,255,255,0.03)" : "#7c3aed",
                color: isStreaming ? "#2d1f4a" : "#fff",
                border: "none", borderRadius: 9,
                fontWeight: 700, fontSize: 13,
                cursor: isStreaming ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: isStreaming ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
              }}
            >
              Start Stream
            </button>
            <button
              onClick={stopWebcam}
              disabled={!isStreaming}
              style={{
                flex: 1, padding: "10px",
                background: "rgba(255,255,255,0.03)",
                color: !isStreaming ? "#2d1f4a" : "#ede9fe",
                border: `0.5px solid ${!isStreaming ? "transparent" : "#1e1530"}`,
                borderRadius: 9,
                fontWeight: 600, fontSize: 13,
                cursor: !isStreaming ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Stop Stream
            </button>
          </div>
        </div>

        {/* In Frame panel */}
        <div style={{
          width: 180,
          background: "#0e0a18",
          borderRadius: 14,
          border: "0.5px solid #1e1530",
          padding: "14px",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700,
            letterSpacing: 2, color: "#2d1f4a",
            textTransform: "uppercase", margin: "0 0 12px",
          }}>
            In Frame
          </p>

          {faces.length === 0 && objects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#2d1f4a", fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🫥</div>
              Nothing detected
            </div>
          ) : (
            <>
              {faces.map((face, i) => {
                const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";
                const isDetecting = face.name === "Detecting...";
                const color = isKnown ? "#a78bfa" : isDetecting ? "#fbbf24" : "#f87171";
                return (
                  <div key={`face-${i}`} style={{
                    padding: "7px 10px", marginBottom: 6,
                    borderRadius: 8,
                    background: `${color}10`,
                    border: `0.5px solid ${color}30`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 11, fontWeight: 600, color }}>
                        {face.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {objects.map((obj, i) => (
                <div key={`obj-${i}`} style={{
                  padding: "7px 10px", marginBottom: 6,
                  borderRadius: 8,
                  background: "rgba(52,211,153,0.06)",
                  border: "0.5px solid rgba(52,211,153,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399" }}>
                      {obj.label}
                    </span>
                    <span style={{ fontSize: 10, color: "#1e4a40", marginLeft: "auto" }}>
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Attendance sidebar */}
        <AttendanceSidebar />
      </div>
    </div>
  );
};

export default WebcamStream;