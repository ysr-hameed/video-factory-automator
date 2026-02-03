export type SectionType = 'hook' | 'overview' | 'core' | 'myth' | 'summary';

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  duration: number; // in seconds
  order: number;
}

export interface VideoProject {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  totalDuration: number;
  status: 'draft' | 'scripting' | 'generating' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  estimatedTime?: string;
}

export const SECTION_CONFIG: Record<SectionType, { 
  label: string; 
  description: string; 
  targetDuration: string;
  color: string;
}> = {
  hook: {
    label: 'Hook',
    description: 'Stop scrolling — grab attention',
    targetDuration: '0:00–0:30',
    color: 'hook',
  },
  overview: {
    label: 'Overview',
    description: 'Mental roadmap for the viewer',
    targetDuration: '0:30–1:00',
    color: 'overview',
  },
  core: {
    label: 'Core Steps',
    description: 'Main value — the meat of the video',
    targetDuration: '1:00–7:00',
    color: 'core',
  },
  myth: {
    label: 'Myth / Mistake',
    description: 'Authority builder — attention reset',
    targetDuration: '7:00–8:30',
    color: 'myth',
  },
  summary: {
    label: 'Summary',
    description: 'Professional close — retention anchor',
    targetDuration: '8:30–10:00',
    color: 'summary',
  },
};
