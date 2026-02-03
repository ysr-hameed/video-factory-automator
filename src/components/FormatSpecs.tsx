import { Monitor, Type, Mic, Move } from 'lucide-react';

const specs = [
  { icon: Monitor, label: 'Resolution', value: '1920×1080', sublabel: '16:9' },
  { icon: Type, label: 'Style', value: 'Dark Minimal', sublabel: 'Clean' },
  { icon: Mic, label: 'Voice', value: 'Consistent TTS', sublabel: 'Locked' },
  { icon: Move, label: 'Motion', value: 'Zoom + Fade', sublabel: 'Slow' },
];

export function FormatSpecs() {
  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Locked Format
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30"
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <spec.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{spec.label}</p>
              <p className="text-sm font-medium truncate">{spec.value}</p>
              <p className="text-xs text-muted-foreground/70">{spec.sublabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
