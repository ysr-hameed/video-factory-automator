import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { FormatSpecs } from '@/components/FormatSpecs';
import { TimelineBar } from '@/components/TimelineBar';
import { ScriptEditor } from '@/components/ScriptEditor';
import { GenerationPipeline } from '@/components/GenerationPipeline';
import { VideoPreview } from '@/components/VideoPreview';
import { toast } from '@/hooks/use-toast';
import type { Section, GenerationStep } from '@/types/video';

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

  const handleUpdateSection = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const simulateStepProgress = useCallback((stepIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setSteps((prev) =>
            prev.map((step, i) =>
              i === stepIndex ? { ...step, status: 'complete', progress: 100 } : step
            )
          );
          resolve();
        } else {
          setSteps((prev) =>
            prev.map((step, i) =>
              i === stepIndex ? { ...step, progress: Math.round(progress) } : step
            )
          );
        }
      }, 200);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setSteps(createInitialSteps());
    setCurrentFrame(1);
    setCurrentTime('00:00');

    toast({
      title: "Generation Started",
      description: "Processing your video script...",
    });

    try {
      for (let i = 0; i < 4; i++) {
        // Set current step to running
        setSteps((prev) =>
          prev.map((step, idx) =>
            idx === i ? { ...step, status: 'running', progress: 0 } : step
          )
        );

        // Simulate progress
        await simulateStepProgress(i);

        // Update frame count and time during generation
        if (i === 1) {
          // During frame generation
          const frameInterval = setInterval(() => {
            setCurrentFrame((prev) => Math.min(prev + 10, 450));
          }, 100);
          await new Promise((r) => setTimeout(r, 500));
          clearInterval(frameInterval);
          setCurrentFrame(450);
        }

        if (i === 3) {
          // During final render
          const timeInterval = setInterval(() => {
            setCurrentTime((prev) => {
              const [mins, secs] = prev.split(':').map(Number);
              const totalSecs = mins * 60 + secs + 30;
              const newMins = Math.floor(totalSecs / 60);
              const newSecs = totalSecs % 60;
              if (newMins >= 10) return '10:00';
              return `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
            });
          }, 100);
          await new Promise((r) => setTimeout(r, 500));
          clearInterval(timeInterval);
          setCurrentTime('10:00');
        }
      }

      toast({
        title: "Video Generated!",
        description: "Your 10-minute video is ready for preview.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "An error occurred during video generation.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, simulateStepProgress]);

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
              <VideoPreview currentFrame={currentFrame} currentTime={currentTime} />
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