'use client';

import { useState, useRef } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { TimelineEditor } from './components/TimelineEditor';
import { VideoPreview } from './components/VideoPreview';

interface TimeSegment {
	start: number;
	end: number;
}

export default function Home() {
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [timeSegments, setTimeSegments] = useState<TimeSegment[]>([]);
	const [title, setTitle] = useState('');
	const [backgroundColor, setBackgroundColor] = useState('#FFD700');
	const [textColor, setTextColor] = useState('#FFFFFF');
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedVideoUrls, setGeneratedVideoUrls] = useState<string[]>([]);

	const handleVideoUpload = (file: File) => {
		setVideoFile(file);
		// Clear previous segments and generated videos when uploading a new video
		setTimeSegments([]);
		setGeneratedVideoUrls([]);
	};

	const handleTimeSegmentsChange = (segments: TimeSegment[]) => {
		setTimeSegments(segments);
		// Clear previous generated videos when changing segments
		setGeneratedVideoUrls([]);
	};

	const handleExport = async () => {
		if (!videoFile || timeSegments.length === 0) {
			alert('请先上传视频并设置时间段');
			return;
		}

		try {
			setIsGenerating(true);
			
			// Create FormData with all required information
			const formData = new FormData();
			formData.append('video', videoFile);
			formData.append('title', title);
			formData.append('backgroundColor', backgroundColor);
			formData.append('textColor', textColor);
			formData.append('segments', JSON.stringify(timeSegments));
			
			// Call the API endpoint
			const response = await fetch('/api/render', {
				method: 'POST',
				body: formData,
			});
			
			if (!response.ok) {
				throw new Error('渲染视频失败');
			}
			
			const result = await response.json();
			setGeneratedVideoUrls(result.videoUrls);
		} catch (error) {
			console.error('视频生成错误:', error);
			alert('生成视频时出错，请重试');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<main className="min-h-screen p-8 bg-gray-100">
			<div className="max-w-6xl mx-auto space-y-8">
				<h1 className="text-3xl font-bold text-center mb-8">视频分割工具</h1>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-6">
						<VideoUploader onUpload={handleVideoUpload} />
						
						<div className="bg-white p-6 rounded-lg shadow">
							<h2 className="text-xl font-semibold mb-4">标题设置</h2>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="输入视频标题"
								className="w-full p-2 border rounded"
							/>
							
							<div className="mt-4 space-y-2">
								<div>
									<label className="block text-sm font-medium">背景颜色</label>
									<input
										type="color"
										value={backgroundColor}
										onChange={(e) => setBackgroundColor(e.target.value)}
										className="mt-1"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium">文字颜色</label>
									<input
										type="color"
										value={textColor}
										onChange={(e) => setTextColor(e.target.value)}
										className="mt-1"
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{videoFile && (
							<>
								<VideoPreview file={videoFile} />
								<TimelineEditor
									videoFile={videoFile}
									onTimePointsChange={handleTimeSegmentsChange}
								/>
							</>
						)}
					</div>
				</div>

				<div className="flex justify-center mt-8">
					<button
						onClick={handleExport}
						className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
						disabled={!videoFile || timeSegments.length === 0 || isGenerating}
					>
						{isGenerating ? '正在生成...' : '生成视频'}
					</button>
				</div>
				
				{/* 生成的视频预览 */}
				{generatedVideoUrls.length > 0 && (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">生成的视频：</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{generatedVideoUrls.map((url, index) => (
								<div key={index} className="bg-white p-4 rounded-lg shadow">
									<h3 className="text-lg font-medium mb-2">片段 {index + 1}</h3>
									<video 
										controls 
										src={url} 
										className="w-full rounded"
									/>
									<div className="mt-2 flex justify-end">
										<a 
											href={url} 
											download={`segment-${index + 1}.mp4`}
											className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
										>
											下载
										</a>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
