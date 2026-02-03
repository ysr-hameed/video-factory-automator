import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import type { GenerationStep } from '@/types/video';

interface GenerationPipelineProps {
  steps: GenerationStep[];
  isGenerating: boolean;
}

export function GenerationPipeline({ steps, isGenerating }: GenerationPipelineProps) {
  const getStatusIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'complete':
        return <Check className="w-4 h-4 text-core" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground/50" />;
    }
  };

  const getStatusStyles = (status: GenerationStep['status']) => {
    switch (status) {
      case 'complete':
        return 'border-core/30 bg-core/5';
      case 'running':
        return 'border-primary/50 bg-primary/5 progress-glow';
      case 'error':
        return 'border-destructive/30 bg-destructive/5';
      default:
        return 'border-border/30 bg-transparent';
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Generation Pipeline
        </h3>
        {isGenerating && (
          <span className="text-xs font-mono text-primary animate-pulse-subtle">
            Processing...
          </span>
        )}
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${getStatusStyles(step.status)}`}
          >
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-[1.375rem] top-12 w-px h-4 bg-border/30" />
            )}

            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              {getStatusIcon(step.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{step.name}</span>
                {step.estimatedTime && step.status === 'pending' && (
                  <span className="text-xs text-muted-foreground font-mono">
                    ~{step.estimatedTime}
                  </span>
                )}
              </div>

              {step.status === 'running' && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block font-mono">
                    {step.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isGenerating && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total estimated time</span>
            <span className="font-mono">~3-4 minutes</span>
          </div>
        </div>
      )}
    </div>
  );
}
