import { Play, Settings, Zap, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function Header({ onGenerate, isGenerating }: HeaderProps) {
  return (
    <header className="glass-panel border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight">GS</span>
            <span className="text-muted-foreground text-sm font-mono">Ground System</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Projects
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Settings
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
            Config
          </Button>
          <Button 
            variant="glow" 
            size="sm" 
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}