import { useRef, useEffect } from "react";
import useWebcam from "../hooks/useWebcam";

const WebcamStream = () => {
  const { videoRef, isStreaming, faces, startWebcam, stopWebcam } = useWebcam();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = 640 / 320;
    const scaleY = 480 / 240;

    faces.forEach((face) => {
      const isKnown = face.name && face.name !== "Unknown" && face.name !== "Detecting...";

      ctx.strokeStyle = isKnown ? "#00FF00" : "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(face.x * scaleX, face.y * scaleY, face.width * scaleX, face.height * scaleY);

      ctx.fillStyle = isKnown ? "#00FF00" : "#FF0000";
      ctx.font = "bold 16px Arial";
      ctx.fillText(face.name || "Unknown", face.x * scaleX, face.y * scaleY - 8);
    });
  }, [faces]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "640px", height: "480px", background: "#000", borderRadius: "8px" }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ position: "absolute", top: 0, left: 0, borderRadius: "8px" }}
        />
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={startWebcam} disabled={isStreaming}>
          Start Stream
        </button>
        <button onClick={stopWebcam} disabled={!isStreaming}>
          Stop Stream
        </button>
      </div>
      <p>{isStreaming ? `🟢 Streaming — ${faces.length} face(s) detected` : "⚫ Stream stopped"}</p>
    </div>
  );
};

export default WebcamStream;