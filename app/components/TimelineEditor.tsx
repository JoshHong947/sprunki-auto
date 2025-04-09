'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/formatTime';

interface TimelineEditorProps {
  videoFile: File;
  onTimePointsChange: (segments: {start: number, end: number}[]) => void;
}

interface TimeSegment {
  id: string;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
}

export function TimelineEditor({ videoFile, onTimePointsChange }: TimelineEditorProps) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeSegments, setTimeSegments] = useState<TimeSegment[]>([]);
  const [activePoint, setActivePoint] = useState<{id: string, type: 'start' | 'end'} | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStartInput, setNewStartInput] = useState('');
  const [newEndInput, setNewEndInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(videoFile);
      
      return () => {
        if (videoRef.current?.src) {
          URL.revokeObjectURL(videoRef.current.src);
        }
      };
    }
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const parseTimeInput = (input: string): number | null => {
    // 支持多种格式：秒数、MM:SS、HH:MM:SS
    if (!input.trim()) return null;

    // 如果是纯数字，当作秒数处理
    if (/^\d+(\.\d+)?$/.test(input)) {
      return parseFloat(input);
    }

    // 处理时间格式
    const parts = input.split(':').map(part => parseInt(part, 10));
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) { // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) { // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return null;
  };

  const addTimeSegment = () => {
    let startTime: number;
    let endTime: number;
    
    if (showAddForm) {
      const parsedStart = parseTimeInput(newStartInput);
      const parsedEnd = parseTimeInput(newEndInput);
      
      if (parsedStart === null || parsedStart < 0 || parsedStart > duration) {
        alert('请输入有效的起始时间');
        return;
      }
      
      if (parsedEnd === null || parsedEnd <= parsedStart || parsedEnd > duration) {
        alert('请输入有效的结束时间（必须大于起始时间）');
        return;
      }
      
      startTime = parsedStart;
      endTime = parsedEnd;
    } else {
      if (!videoRef.current) return;
      
      // 使用当前时间作为起始点，并向后10秒作为结束点（如果可能）
      startTime = videoRef.current.currentTime;
      endTime = Math.min(startTime + 10, duration);
    }

    const newSegment: TimeSegment = {
      id: Math.random().toString(36).substr(2, 9),
      start: startTime,
      end: endTime,
      startLabel: formatTime(startTime),
      endLabel: formatTime(endTime)
    };

    const newSegments = [...timeSegments, newSegment].sort((a, b) => a.start - b.start);
    setTimeSegments(newSegments);
    onTimePointsChange(newSegments.map(seg => ({start: seg.start, end: seg.end})));
    setShowAddForm(false);
    setNewStartInput('');
    setNewEndInput('');
  };

  const removeTimeSegment = (id: string) => {
    const newSegments = timeSegments.filter(segment => segment.id !== id);
    setTimeSegments(newSegments);
    onTimePointsChange(newSegments.map(seg => ({start: seg.start, end: seg.end})));
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || activePoint) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    // Create a new segment starting from the clicked time
    const endTime = Math.min(time + 10, duration);
    
    const newSegment: TimeSegment = {
      id: Math.random().toString(36).substr(2, 9),
      start: time,
      end: endTime,
      startLabel: formatTime(time),
      endLabel: formatTime(endTime)
    };
    
    const newSegments = [...timeSegments, newSegment].sort((a, b) => a.start - b.start);
    setTimeSegments(newSegments);
    onTimePointsChange(newSegments.map(seg => ({start: seg.start, end: seg.end})));
  };

  const handlePointDragStart = (id: string, type: 'start' | 'end') => {
    setActivePoint({id, type});
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePoint || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = percentage * duration;

    const newSegments = timeSegments.map(segment => {
      if (segment.id === activePoint.id) {
        if (activePoint.type === 'start') {
          // Ensure start time doesn't exceed end time
          const newStart = Math.min(time, segment.end - 0.5);
          return {
            ...segment,
            start: newStart,
            startLabel: formatTime(newStart)
          };
        } else {
          // Ensure end time doesn't precede start time
          const newEnd = Math.max(time, segment.start + 0.5);
          return {
            ...segment,
            end: newEnd,
            endLabel: formatTime(newEnd)
          };
        }
      }
      return segment;
    });

    setTimeSegments(newSegments);
    onTimePointsChange(newSegments.map(seg => ({start: seg.start, end: seg.end})));
  };

  const handleDragEnd = () => {
    setActivePoint(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">时间点设置</h2>
      
      <video
        ref={videoRef}
        controls
        className="w-full rounded"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />

      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium">
          当前时间: {formatTime(currentTime)}
        </div>
        <div className="text-sm font-medium">
          总时长: {formatTime(duration)}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {showAddForm ? '取消' : '添加时间段'}
        </button>
      </div>

      {showAddForm && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium min-w-[60px]">起始时间:</label>
            <input
              type="text"
              value={newStartInput}
              onChange={(e) => setNewStartInput(e.target.value)}
              placeholder="例如: 1:30 或 90"
              className="flex-1 p-2 border rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium min-w-[60px]">结束时间:</label>
            <input
              type="text"
              value={newEndInput}
              onChange={(e) => setNewEndInput(e.target.value)}
              placeholder="例如: 2:30 或 150"
              className="flex-1 p-2 border rounded"
            />
          </div>
          <button
            onClick={addTimeSegment}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
          >
            确认
          </button>
        </div>
      )}

      <div
        ref={timelineRef}
        className="relative w-full h-12 bg-gray-200 rounded cursor-pointer"
        onClick={handleTimelineClick}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 播放进度 */}
        <div
          className="absolute h-full bg-blue-200"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {/* 时间段标记 */}
        {timeSegments.map((segment) => (
          <div key={segment.id} className="absolute h-full flex items-center">
            {/* 开始点 */}
            <div
              className={`absolute w-1 h-full cursor-ew-resize ${
                activePoint?.id === segment.id && activePoint?.type === 'start' 
                  ? 'bg-red-600' 
                  : 'bg-red-500'
              }`}
              style={{ left: `${(segment.start / duration) * 100}%` }}
              onMouseDown={() => handlePointDragStart(segment.id, 'start')}
              title={`开始: ${segment.startLabel}`}
            />
            {/* 结束点 */}
            <div
              className={`absolute w-1 h-full cursor-ew-resize ${
                activePoint?.id === segment.id && activePoint?.type === 'end' 
                  ? 'bg-red-600' 
                  : 'bg-red-500'
              }`}
              style={{ left: `${(segment.end / duration) * 100}%` }}
              onMouseDown={() => handlePointDragStart(segment.id, 'end')}
              title={`结束: ${segment.endLabel}`}
            />
            {/* 时间段填充 */}
            <div
              className="absolute h-full bg-red-200 opacity-50"
              style={{ 
                left: `${(segment.start / duration) * 100}%`,
                width: `${((segment.end - segment.start) / duration) * 100}%`
              }}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">已设置的时间段：</div>
        {timeSegments.length === 0 ? (
          <div className="text-sm text-gray-500">暂无时间段</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {timeSegments.map((segment) => (
              <div
                key={segment.id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded"
              >
                <span className="text-sm">
                  {segment.startLabel} - {segment.endLabel} 
                  (时长: {formatTime(segment.end - segment.start)})
                </span>
                <button
                  onClick={() => removeTimeSegment(segment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 