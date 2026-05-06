import useWebcam from "../hooks/useWebcam";

const WebcamStream = () => {
  const { videoRef, isStreaming, startWebcam, stopWebcam } = useWebcam();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "640px", height: "480px", background: "#000", borderRadius: "8px" }}
      />
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={startWebcam} disabled={isStreaming}>
          Start Stream
        </button>
        <button onClick={stopWebcam} disabled={!isStreaming}>
          Stop Stream
        </button>
      </div>
      <p>{isStreaming ? "🟢 Streaming at 15 FPS" : "⚫ Stream stopped"}</p>
    </div>
  );
};

export default WebcamStream;