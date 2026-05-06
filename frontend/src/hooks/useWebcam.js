import { useEffect, useRef, useState } from "react";
import axios from "axios";

const useWebcam = () => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error("Webcam access denied:", err);
    }
  };

  const stopWebcam = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    setIsStreaming(false);
  };

  const captureAndSendFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const base64Frame = canvas.toDataURL("image/jpeg").split(",")[1];

    axios.post("http://localhost:8000/frame", { frame: base64Frame })
      .catch((err) => console.error("Frame send error:", err));
  };

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(captureAndSendFrame, 1000 / 15);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isStreaming]);

  return { videoRef, isStreaming, startWebcam, stopWebcam };
};

export default useWebcam;