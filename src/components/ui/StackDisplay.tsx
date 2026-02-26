'use client';

import { ProjectStack } from '@/lib/githubAggregator';
import { Code2, Database, Lock, Cloud, TestTube } from 'lucide-react';

interface StackDisplayProps {
  stack?: ProjectStack;
  compact?: boolean;
}

const ICONS: Record<keyof ProjectStack, React.ReactNode> = {
  frameworks: <Code2 size={16} />,
  databases: <Database size={16} />,
  auth: <Lock size={16} />,
  infra: <Cloud size={16} />,
  testing: <TestTube size={16} />,
  other: <Code2 size={16} />,
};

const LABELS: Record<keyof ProjectStack, string> = {
  frameworks: 'Frameworks',
  databases: 'Databases',
  auth: 'Auth',
  infra: 'Infrastructure',
  testing: 'Testing',
  other: 'Other',
};

export default function StackDisplay({ stack, compact = false }: StackDisplayProps) {
  if (!stack || !Object.values(stack).some(items => items.length > 0)) {
    return null;
  }

  const categories = (Object.keys(stack) as Array<keyof ProjectStack>).filter(
    key => stack[key].length > 0
  );

  if (compact) {
    // Show as a single-line tag list
    const allTechs = Object.values(stack).flat();
    return (
      <div className="flex flex-wrap gap-1">
        {allTechs.map(tech => (
          <span
            key={tech}
            className="text-xs px-2 py-1 rounded bg-cyan-glowing/10 text-cyan-glowing border border-cyan-glowing/20 font-mono"
          >
            {tech}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-foreground/5 border border-glass-border">
      <div className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
        <Code2 size={16} className="text-cyan-glowing" />
        Technology Stack
      </div>

      <div className="grid grid-cols-1 gap-2">
        {categories.map(category => (
          <div key={category} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
              {ICONS[category]}
              <span>{LABELS[category]}</span>
            </div>
            <div className="flex flex-wrap gap-1 ml-1">
              {stack[category].map(tech => (
                <span
                  key={tech}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-burnt/10 text-emerald-burnt border border-emerald-burnt/20 font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
