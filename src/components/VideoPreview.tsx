import { Play, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPreviewProps {
  currentFrame?: number;
  currentTime?: string;
}

export function VideoPreview({ currentFrame = 1, currentTime = '00:00' }: VideoPreviewProps) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Preview
        </h3>
        <Button variant="ghost" size="icon" className="w-7 h-7">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative aspect-video rounded-lg overflow-hidden bg-background border border-border/30">
        {/* Simulated video preview with gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/50 to-background">
          {/* Centered content preview */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-foreground/90">
                How DNS Actually Works
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                The complete explanation in under 10 minutes
              </p>
            </div>
          </div>

          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="glow" size="icon" className="w-14 h-14 rounded-full">
            <Play className="w-6 h-6 ml-0.5" />
          </Button>
        </div>

        {/* Resolution badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-xs font-mono text-muted-foreground">
          1920×1080
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Frame {currentFrame} / 450</span>
        <span className="font-mono">{currentTime} / 10:00</span>
      </div>
    </div>
  );
}