import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

const useWebcam = () => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faces, setFaces] = useState([]);
  const [objects, setObjects] = useState([]);
  const isRunning = useRef(false);

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
    isRunning.current = false;
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    setIsStreaming(false);
    setFaces([]);
    setObjects([]);
  };

  const captureAndSendFrame = useCallback(async () => {
    if (!videoRef.current || !isRunning.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const base64Frame = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

    try {
      const response = await axios.post("http://localhost:8000/frame", { frame: base64Frame });
      setFaces(response.data.faces);
      setObjects(response.data.objects || []);
    } catch (err) {
      console.error("Frame send error:", err);
    }

    if (isRunning.current) {
      setTimeout(captureAndSendFrame, 50);
    }
  }, []);

  useEffect(() => {
    if (isStreaming) {
      isRunning.current = true;
      captureAndSendFrame();
    } else {
      isRunning.current = false;
    }
  }, [isStreaming, captureAndSendFrame]);

  return { videoRef, isStreaming, faces, objects, startWebcam, stopWebcam };
};

export default useWebcam;