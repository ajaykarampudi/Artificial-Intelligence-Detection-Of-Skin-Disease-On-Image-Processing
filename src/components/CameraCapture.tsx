import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, AlertCircle, Sparkles, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64Data: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera for skin scanning
        audio: false,
      });
      setStream(mediaStream);
      setPermissionGranted(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please make sure camera permissions are enabled in your browser, or upload an image file instead.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function handleCapture() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Set canvas dimensions to match the actual video stream
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get base64 representation
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
      }
    }
  }

  function handleConfirm() {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  }

  function handleRetake() {
    setCapturedImage(null);
    // Restart stream to be active if it was paused or to refresh
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden text-slate-100 max-w-lg mx-auto">
      <div className="absolute top-0 right-0 bg-blue-500/10 px-4 py-1 text-xs text-blue-400 font-mono tracking-widest border-l border-b border-blue-500/20 rounded-bl-lg uppercase">
        Live Scanner
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
          <Camera className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Real-Time Skin Scan</h3>
          <p className="text-xs text-slate-400">Position the affected skin area inside the frame</p>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-lg flex items-start gap-3 my-6">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="text-sm">
            <p className="font-medium text-rose-200">Camera Unreachable</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{error}</p>
            <button
              onClick={startCamera}
              className="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs rounded-lg font-medium transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform scale-x-100"
              />
              {/* Target bracket overlay */}
              <div className="absolute inset-8 border border-blue-500/30 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                
                <div className="text-blue-400/40 text-[10px] font-mono uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-full border border-blue-500/20">
                  <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
                  Analyzing framing
                </div>
              </div>
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured Frame"
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>

        {!capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={!permissionGranted || !!error}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Capture Snapshot
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button
              onClick={handleRetake}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Use Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
