import { classNames } from '~/utils/classNames';

export interface CoherenceBadgeProps {
    score: number;
    size?: 'sm' | 'md';
    showTooltip?: boolean;
}

export function CoherenceBadge({ score, size = 'sm', showTooltip = true }: CoherenceBadgeProps) {
    const getColor = (value: number) => {
        if (value >= 80) return 'text-green-500 bg-green-50';
        if (value >= 70) return 'text-yellow-500 bg-yellow-50';
        return 'text-orange-500 bg-orange-50';
    };

    const getIcon = (value: number) => {
        if (value >= 80) return 'i-ph:check-circle-fill';
        if (value >= 70) return 'i-ph:warning-circle-fill';
        return 'i-ph:x-circle-fill';
    };

    const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

    return (
        <div
            className={classNames(
                'inline-flex items-center gap-1 rounded-full font-medium',
                getColor(score),
                sizeClasses
            )}
            title={showTooltip ? `Coherence: ${score}% aligned with intent` : undefined}
        >
            <div className={classNames(getIcon(score), 'text-xs')} />
            <span>{score}%</span>
        </div>
    );
}
