'use client';

import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  file: File;
}

export function VideoPreview({ file }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
    }

    return () => {
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, [file]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">视频预览</h2>
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg"
        style={{ maxHeight: '400px' }}
      />
    </div>
  );
} 