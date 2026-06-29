import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera permission in your browser settings to use this.'
            : 'Could not access a camera on this device.'
        );
      });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `book-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      },
      'image/jpeg',
      0.9
    );
  }

  return (
    <div className="border border-amber-200 rounded-md p-3 flex flex-col gap-3 bg-amber-50">
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-xs rounded-md bg-black" />
      )}
      <div className="flex gap-2">
        {!error && (
          <button
            type="button"
            onClick={handleCapture}
            className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Capture
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
