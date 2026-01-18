import { memo, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { Markdown } from './Markdown';
import { IntentAlignment } from '~/components/intelligence/IntentAlignment';

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  isFirst?: boolean;
}

export const AssistantMessage = memo(({ content, isStreaming = false, isFirst = false }: AssistantMessageProps) => {
  const graph = useStore(graphStore);

  // Determine intent alignment stage
  const intentStage = useMemo(() => {
    if (!graph.north) return null;
    if (isFirst) return 'understanding';
    if (isStreaming) return 'generating';
    return 'complete';
  }, [graph.north, isFirst, isStreaming]);

  // Calculate simple coherence (can be enhanced with real calculation)
  const coherence = graph.signal?.drift ? Math.max(0, 100 - graph.signal.drift) : 85;

  return (
    <div className="overflow-hidden w-full">
      {/* Show intent alignment if we have understanding */}
      {graph.north && intentStage && (
        <IntentAlignment
          intent={graph.north.statement}
          coherence={coherence}
          stage={intentStage as 'understanding' | 'generating' | 'complete'}
        />
      )}

      <Markdown html>{content}</Markdown>
    </div>
  );
});
