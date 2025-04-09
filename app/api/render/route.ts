import { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

const RENDER_URL = 'http://localhost:4000/render';

interface TimeSegment {
	start: number;
	end: number;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const video = formData.get('video') as File;
		const title = formData.get('title') as string;
		const backgroundColor = formData.get('backgroundColor') as string;
		const textColor = formData.get('textColor') as string;
		const segmentsJson = formData.get('segments') as string;
		
		if (!video || !segmentsJson) {
			return new Response(JSON.stringify({ error: '缺少必要的参数' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Parse the time segments
		const segments: TimeSegment[] = JSON.parse(segmentsJson);
		
		// Create a unique job ID for this rendering task
		const jobId = uuidv4();
		const workDir = join(process.cwd(), 'temp', jobId);
		await mkdir(workDir, { recursive: true });
		
		// Save the uploaded video to the temp directory
		const videoPath = join(workDir, 'input.mp4');
		const videoArrayBuffer = await video.arrayBuffer();
		await writeFile(videoPath, Buffer.from(videoArrayBuffer));

		// Process each segment
		const videoUrls: string[] = [];
		
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const outputFileName = `segment-${i+1}.mp4`;
			
			// Call the Revideo render service
			const renderResponse = await fetch(RENDER_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					projectFile: './revideo/project.ts',
					variables: {
						videoSources: [videoPath],
						titleText: title || 'Sprunki',
						titleBgColor: backgroundColor || '#FFD700',
						titleTextColor: textColor || '#FFFFFF',
						segmentStart: segment.start,
						segmentEnd: segment.end
					},
					settings: {
						outFile: outputFileName,
						outDir: workDir,
						dimensions: [1080, 1920], // 9:16 vertical format
					}
				}),
			});

			if (!renderResponse.ok) {
				const errorText = await renderResponse.text();
				throw new Error(`Rendering failed: ${errorText}`);
			}
			
			// Add the video URL to the list
			const resultData = await renderResponse.json();
			videoUrls.push(`/temp/${jobId}/${resultData.outputFile}`);
		}

		return new Response(JSON.stringify({ videoUrls }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Render error:', error);
		return new Response(JSON.stringify({ error: '视频渲染失败' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
