import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, AlignLeft } from 'lucide-react';
import { SECTION_CONFIG, type Section, type SectionType } from '@/types/video';
import { Button } from './ui/button';

interface ScriptEditorProps {
  sections: Section[];
  onUpdateSection: (id: string, content: string) => void;
}

export function ScriptEditor({ sections, onUpdateSection }: ScriptEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(sections[0]?.id);

  const getSectionBadgeClass = (type: SectionType) => {
    const classes: Record<SectionType, string> = {
      hook: 'section-badge-hook',
      overview: 'section-badge-overview',
      core: 'section-badge-core',
      myth: 'section-badge-myth',
      summary: 'section-badge-summary',
    };
    return classes[type];
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const estimateDuration = (words: number) => Math.ceil(words / 150); // ~150 words per minute

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlignLeft className="w-5 h-5 text-primary" />
            Script Editor
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">
              {sections.reduce((acc, s) => acc + wordCount(s.content), 0)} words
            </span>
            <span>•</span>
            <span className="font-mono">
              ~{sections.reduce((acc, s) => acc + estimateDuration(wordCount(s.content)), 0)} min
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sections.map((section) => {
          const config = SECTION_CONFIG[section.type];
          const isExpanded = expandedSection === section.id;
          const words = wordCount(section.content);

          return (
            <div
              key={section.id}
              className={`rounded-lg border transition-all duration-200 ${
                isExpanded
                  ? 'border-primary/30 bg-secondary/30'
                  : 'border-border/30 bg-secondary/10 hover:border-border/50'
              }`}
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                
                <span className={`section-badge ${getSectionBadgeClass(section.type)}`}>
                  {config.label}
                </span>

                <span className="flex-1 text-sm font-medium truncate">
                  {section.title || 'Untitled section'}
                </span>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{words} words</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {config.targetDuration}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-3">
                    {config.description}
                  </p>
                  <textarea
                    value={section.content}
                    onChange={(e) => onUpdateSection(section.id, e.target.value)}
                    placeholder={`Write your ${config.label.toLowerCase()} content here...`}
                    className="w-full h-48 p-4 rounded-lg bg-background/50 border border-border/50 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      ~{estimateDuration(words)} min read time
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      AI Assist
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
