import { SECTION_CONFIG, type SectionType } from '@/types/video';

interface TimelineBarProps {
  sections: { type: SectionType; duration: number }[];
  totalDuration: number;
}

export function TimelineBar({ sections, totalDuration }: TimelineBarProps) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Video Timeline
        </h3>
        <span className="text-sm font-mono text-muted-foreground">
          {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')} total
        </span>
      </div>
      
      <div className="relative">
        {/* Timeline bar */}
        <div className="h-10 rounded-lg overflow-hidden flex">
          {sections.map((section, index) => {
            const widthPercent = (section.duration / totalDuration) * 100;
            const config = SECTION_CONFIG[section.type];
            return (
              <div
                key={index}
                className="relative group transition-all duration-200 hover:brightness-110"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: `hsl(var(--${config.color}) / 0.8)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time markers */}
        <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
          <span>0:00</span>
          <span>2:30</span>
          <span>5:00</span>
          <span>7:30</span>
          <span>10:00</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(SECTION_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `hsl(var(--${config.color}))` }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
