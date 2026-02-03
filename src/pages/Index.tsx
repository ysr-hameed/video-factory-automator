import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { FormatSpecs } from '@/components/FormatSpecs';
import { TimelineBar } from '@/components/TimelineBar';
import { ScriptEditor } from '@/components/ScriptEditor';
import { GenerationPipeline } from '@/components/GenerationPipeline';
import { VideoPreview } from '@/components/VideoPreview';
import { toast } from '@/hooks/use-toast';
import type { Section, GenerationStep } from '@/types/video';
import { VideoGenerationService } from '@/services/videoGeneration';

const initialSections: Section[] = [
  {
    id: '1',
    type: 'hook',
    title: 'The Hidden System',
    content: 'Every time you type a website into your browser, something invisible happens. A system older than the modern web itself springs into action. Most people use it thousands of times a day without knowing it exists.',
    duration: 30,
    order: 1,
  },
  {
    id: '2',
    type: 'overview',
    title: 'What You Will Learn',
    content: 'In the next 10 minutes, you will understand exactly how DNS works. We will cover the complete journey from your browser to the server and back. By the end, you will never look at a URL the same way again.',
    duration: 30,
    order: 2,
  },
  {
    id: '3',
    type: 'core',
    title: 'The DNS Journey',
    content: 'Step 1: Your browser checks its local cache. If you have visited this site before, the answer might already be there. Step 2: The operating system cache is checked next. This is faster than asking the internet. Step 3: The recursive resolver takes over. This is usually your ISP or a public DNS service.',
    duration: 360,
    order: 3,
  },
  {
    id: '4',
    type: 'myth',
    title: 'Common Misconception',
    content: 'Many people think DNS is slow. The truth is, DNS is optimized for speed at every level. Caching happens at multiple points. The real bottleneck is almost never DNS itself.',
    duration: 90,
    order: 4,
  },
  {
    id: '5',
    type: 'summary',
    title: 'What You Now Know',
    content: 'DNS is the phonebook of the internet. It translates human-readable names to machine-readable addresses. The system is distributed, cached, and remarkably fast. You now understand what happens in those milliseconds before a page loads.',
    duration: 90,
    order: 5,
  },
];

const createInitialSteps = (): GenerationStep[] => [
  { id: '1', name: 'Text-to-Speech', status: 'pending', progress: 0, estimatedTime: '2 min' },
  { id: '2', name: 'Generate Frames', status: 'pending', progress: 0, estimatedTime: '20 sec' },
  { id: '3', name: 'Apply Motion', status: 'pending', progress: 0, estimatedTime: '20 sec' },
  { id: '4', name: 'Render Video', status: 'pending', progress: 0, estimatedTime: '30 sec' },
];

export default function Index() {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [steps, setSteps] = useState<GenerationStep[]>(createInitialSteps);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const videoGenerationService = useRef(new VideoGenerationService());

  const handleUpdateSection = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setSteps(createInitialSteps());
    setCurrentFrame(1);
    setCurrentTime('00:00');

    // Clean up previous video URL
    if (generatedVideoUrl) {
      URL.revokeObjectURL(generatedVideoUrl);
      setGeneratedVideoUrl(null);
    }

    toast({
      title: "Generation Started",
      description: "Processing your video script with real generation...",
    });

    try {
      const service = videoGenerationService.current;
      
      const videoBlob = await service.generateVideo(sections, (progress) => {
        // Map generation steps to UI steps
        const stepMapping = {
          tts: 0,
          frames: 1,
          motion: 2,
          render: 3,
        };

        const stepIndex = stepMapping[progress.step];

        // Update current step
        setSteps((prev) =>
          prev.map((step, idx) => {
            if (idx === stepIndex) {
              return {
                ...step,
                status: 'running' as const,
                progress: Math.round(progress.progress),
              };
            } else if (idx < stepIndex) {
              return { ...step, status: 'complete' as const, progress: 100 };
            }
            return step;
          })
        );

        // Update frame count during frame generation
        if (progress.step === 'frames' && progress.currentFrame) {
          setCurrentFrame(progress.currentFrame);
        }

        // Update time during render
        if (progress.step === 'render' && progress.progress > 0) {
          const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
          const currentSeconds = Math.floor((progress.progress / 100) * totalDuration);
          const mins = Math.floor(currentSeconds / 60);
          const secs = currentSeconds % 60;
          setCurrentTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      });

      // Mark all steps as complete
      setSteps((prev) =>
        prev.map((step) => ({ ...step, status: 'complete' as const, progress: 100 }))
      );

      // Create object URL for the video
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

      // Set final values
      const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
      const totalFrames = Math.ceil(totalDuration * 30); // FPS from service config
      setCurrentFrame(totalFrames);
      const mins = Math.floor(totalDuration / 60);
      const secs = totalDuration % 60;
      setCurrentTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

      toast({
        title: "Video Generated!",
        description: "Your video is ready for preview and download.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during video generation.",
        variant: "destructive",
      });
      
      // Mark current step as error
      setSteps((prev) => {
        const runningIndex = prev.findIndex(s => s.status === 'running');
        if (runningIndex >= 0) {
          return prev.map((step, idx) =>
            idx === runningIndex ? { ...step, status: 'error' as const } : step
          );
        }
        return prev;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, sections, generatedVideoUrl]);

  const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);
  const timelineSections = sections.map((s) => ({ type: s.type, duration: s.duration }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Ambient glow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <Header onGenerate={handleGenerate} isGenerating={isGenerating} />

      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* Top row: Specs + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <FormatSpecs />
            <div className="lg:col-span-2">
              <TimelineBar sections={timelineSections} totalDuration={totalDuration} />
            </div>
          </div>

          {/* Main content: Editor + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col min-h-[600px]">
              <ScriptEditor sections={sections} onUpdateSection={handleUpdateSection} />
            </div>

            <div className="space-y-6">
              <VideoPreview 
                currentFrame={currentFrame} 
                currentTime={currentTime} 
                videoUrl={generatedVideoUrl}
              />
              <GenerationPipeline steps={steps} isGenerating={isGenerating} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>GS Video Factory • Consistent quality at scale</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}