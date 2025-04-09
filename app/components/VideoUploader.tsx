'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
}

export function VideoUploader({ onUpload }: VideoUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    } else {
      alert('请上传有效的视频文件');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-lg font-medium">
          {isDragActive ? '放开以上传视频' : '拖拽视频到此处或点击上传'}
        </div>
        <p className="text-sm text-gray-500">
          支持 MP4, MOV, AVI, WebM 格式
        </p>
      </div>
    </div>
  );
} 