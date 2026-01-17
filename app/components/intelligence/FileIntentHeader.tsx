import { CoherenceBadge } from './CoherenceBadge';
import { classNames } from '~/utils/classNames';

export interface FileIntentHeaderProps {
    fileName: string;
    intent?: string;
    coherence?: number;
}

export function FileIntentHeader({ fileName, intent, coherence = 85 }: FileIntentHeaderProps) {
    if (!intent) return null;

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-3 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="i-ph:target-duotone text-blue-500 text-lg flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                    <span className="text-xs text-bolt-elements-textTertiary">Intent for this file:</span>
                    <span className="text-sm text-bolt-elements-textPrimary font-medium truncate">
                        {intent}
                    </span>
                </div>
            </div>
            <CoherenceBadge score={coherence} size="md" />
        </div>
    );
}
