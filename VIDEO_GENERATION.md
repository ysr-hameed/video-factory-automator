# Video Generation Feature

## Overview

This project now includes **real video generation** capabilities using browser-native APIs. The system can generate professional-looking videos from text scripts without requiring external services or heavy backend infrastructure.

## Features

### ✅ Real Video Generation
- **Text-to-Speech**: Converts script text to speech using Web Speech API (with graceful degradation)
- **Frame Generation**: Creates animated video frames with Canvas API
- **Video Rendering**: Combines frames into video using MediaRecorder API
- **Download**: Export generated videos as WebM format

### 🎨 Visual Effects
- Section-specific color gradients (Hook, Overview, Core, Myth, Summary)
- Animated text reveals with fade effects
- Professional typography and layout
- Section badges and timestamps
- 1920×1080 Full HD resolution

### 📊 Progress Tracking
- Real-time progress updates for each generation step
- Frame count tracking
- Time estimation
- Step-by-step pipeline visualization

## Architecture

### Services

#### 1. **TextToSpeechService** (`src/services/textToSpeech.ts`)
Handles text-to-speech conversion using the Web Speech API.

```typescript
const ttsService = new TextToSpeechService();
const audioBlob = await ttsService.textToSpeech(text, {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
});
```

**Features:**
- Voice selection (prefers English voices)
- Adjustable rate, pitch, and volume
- Progress tracking via callbacks
- Graceful degradation when TTS unavailable

#### 2. **FrameGeneratorService** (`src/services/frameGenerator.ts`)
Generates video frames using HTML5 Canvas.

```typescript
const generator = new FrameGeneratorService({
  width: 1920,
  height: 1080,
  fps: 30
});
const frames = await generator.generateFrames(sections);
```

**Features:**
- Customizable resolution and FPS
- Section-specific visual themes
- Text overlay with word-wrapping
- Progressive text reveal animations
- Section badges and timestamps

#### 3. **VideoRendererService** (`src/services/videoRenderer.ts`)
Renders frames into a video file using MediaRecorder API.

```typescript
const renderer = new VideoRendererService({ fps: 30 });
const videoBlob = await renderer.renderVideo(frames, audioBlob);
```

**Features:**
- VP9/VP8 codec support
- Configurable bitrate
- Audio track integration
- Progress tracking

#### 4. **VideoGenerationService** (`src/services/videoGeneration.ts`)
Orchestrates the entire video generation pipeline.

```typescript
const service = new VideoGenerationService({
  width: 1920,
  height: 1080,
  fps: 30
});
const videoBlob = await service.generateVideo(sections, (progress) => {
  console.log(progress.step, progress.progress);
});
```

## Usage

### Basic Usage

1. **Edit your script** in the Script Editor
2. **Click Generate** button
3. **Wait for generation** to complete (progress shown in pipeline)
4. **Preview video** in the Preview panel
5. **Download** using the download button

### Generation Pipeline Steps

1. **Text-to-Speech** (~1-2 min): Converts script to speech
2. **Generate Frames** (~10-30 sec): Creates video frames with animations
3. **Apply Motion** (~5-10 sec): Adds motion effects  
4. **Render Video** (~10-30 sec): Combines everything into final video

### Customization

You can customize video generation in `src/pages/Index.tsx`:

```typescript
const videoGenerationService = useRef(new VideoGenerationService({
  width: 1920,    // Video width
  height: 1080,   // Video height
  fps: 30,        // Frames per second
  ttsRate: 1.0,   // Speech rate
  ttsPitch: 1.0,  // Speech pitch
}));
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️  Headless browsers (limited TTS support)

### Required APIs
- **Web Speech API** (optional, for TTS)
- **Canvas API** (required)
- **MediaRecorder API** (required)

## Performance Considerations

### Generation Time
- Short videos (1-2 min): ~30-60 seconds
- Medium videos (5-10 min): ~2-4 minutes
- Long videos (10+ min): ~5-10 minutes

### Optimization Tips
1. **Reduce FPS**: Lower FPS (e.g., 24) = faster generation
2. **Lower Resolution**: 1280×720 generates faster than 1920×1080
3. **Shorter Scripts**: Fewer sections = faster generation
4. **Browser Performance**: Close other tabs for best performance

## Troubleshooting

### TTS Not Working
**Issue**: Speech synthesis fails or is unavailable  
**Solution**: The system will continue without audio. Audio generation is optional.

### Slow Generation
**Issue**: Video generation takes too long  
**Solution**: 
- Reduce video resolution
- Lower FPS to 24
- Shorten script content
- Use a more powerful device

### Video Won't Play
**Issue**: Generated video won't play in video player  
**Solution**:
- Use a modern browser (Chrome/Edge recommended)
- Check console for codec errors
- Try downloading and playing in VLC Media Player

### Out of Memory
**Issue**: Browser crashes or runs out of memory  
**Solution**:
- Close other browser tabs
- Reduce video length
- Lower resolution/FPS
- Restart browser

## Future Enhancements

Potential improvements for future versions:

- [ ] Cloud-based rendering for longer videos
- [ ] More animation presets and transitions
- [ ] Background music integration
- [ ] Custom branding/watermarks
- [ ] Multiple export formats (MP4, GIF)
- [ ] Batch video generation
- [ ] Template library
- [ ] AI-powered script generation

## Technical Notes

### Why Browser-Native APIs?

This implementation uses browser-native APIs for several reasons:

1. **No Backend Required**: Everything runs client-side
2. **No External Dependencies**: No API keys or cloud services needed
3. **Privacy**: User content never leaves their browser
4. **Cost**: Zero infrastructure costs
5. **Instant**: No upload/download time

### Limitations

- **Long Videos**: Very long videos (>20 min) may cause performance issues
- **Audio Quality**: Web Speech API quality varies by browser/OS
- **Export Format**: Limited to WebM format (most browsers support)
- **Processing Power**: Requires modern device with adequate RAM

## Contributing

To improve video generation:

1. **Optimize Frame Generation**: Make it more efficient
2. **Add More Effects**: Implement additional visual effects
3. **Improve TTS**: Add alternative TTS solutions
4. **Better Codecs**: Support more video formats
5. **Cloud Integration**: Add optional cloud rendering

## License

Same as the main project.
