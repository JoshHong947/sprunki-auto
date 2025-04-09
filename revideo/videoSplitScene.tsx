/** @jsxImportSource @revideo/2d/lib */
import {makeScene2D, Rect, Layout, Video, Txt, View2D} from '@revideo/2d';
import {createRef, useScene, waitFor} from '@revideo/core';

export default makeScene2D(function* (view: View2D) {
    // Get variables from scene
    const videoSources = useScene().variables.get('videoSources', ['video1.mp4']);
    const titleText = useScene().variables.get('titleText', '默认标题');
    const titleBgColor = useScene().variables.get('titleBgColor', '#FFD700'); // 默认黄色背景
    const titleTextColor = useScene().variables.get('titleTextColor', '#FFFFFF'); // 默认白色文字
    const segmentStart = useScene().variables.get('segmentStart', 0); // 视频片段开始时间（秒）
    const segmentEnd = useScene().variables.get('segmentEnd', 10); // 视频片段结束时间（秒）

    // 计算片段时长
    const segmentDuration = Number(segmentEnd) - Number(segmentStart);

    // Set up 9:16 aspect ratio
    const width = 1080;  // 标准竖屏宽度
    const height = 1920; // 标准竖屏高度
    view.size(width, height);

    // Background
    view.fill('#000000');

    // Title section (top 15% of screen)
    const titleHeight = height * 0.15;
    
    // Video section (remaining 85% of screen)
    const videoSectionHeight = height - titleHeight;
    const videoHeight = videoSectionHeight / 3; // 3等分视频高度

    // 视频引用数组
    const videoRefs = Array(3).fill(null).map(() => createRef<Video>());

    // Create layout
    yield view.add(
        <Layout>
            {/* Title bar */}
            <Rect
                x={0}
                y={-height/2 + titleHeight/2}
                width={width}
                height={titleHeight}
                fill={titleBgColor}
            />
            <Txt
                text={titleText}
                x={0}
                y={-height/2 + titleHeight/2}
                fontSize={titleHeight * 0.4}
                fill={titleTextColor}
                fontFamily={'Arial'}
                fontWeight={700}
            />
            
            {/* Video container - 3 rows of the same video */}
            <Layout
                direction={'column'}
                y={-height/2 + titleHeight + videoSectionHeight/2}
                gap={0}
            >
                {videoRefs.map((ref, index) => (
                    <Video
                        key={`video-${index}`}
                        ref={ref}
                        src={videoSources()[0]}
                        size={[width, videoHeight]}
                    />
                ))}
            </Layout>
        </Layout>
    );

    // Wait for the segment duration
    yield* waitFor(segmentDuration);
}); 