import { memo } from 'react';
import { TIERS, type TierName } from '~/lib/billing/tiers';
import { Button } from '~/components/ui/Button';

interface TierCardProps {
    tier: TierName;
    currentTier?: TierName;
    onUpgrade?: (tier: TierName) => void;
}

const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
        />
    </svg>
);

export const TierCard = memo(({ tier, currentTier, onUpgrade }: TierCardProps) => {
    const tierData = TIERS[tier];
    const isCurrent = currentTier === tier;
    const isPopular = tierData.popular;

    return (
        <div
            className={`relative flex flex-col p-6 rounded-lg border-2 transition-all ${isPopular
                    ? 'border-accent-500 shadow-lg scale-105'
                    : 'border-bolt-elements-borderColor hover:border-accent-300'
                } ${isCurrent ? 'bg-accent-500/5' : 'bg-bolt-elements-background-depth-2'}`}
        >
            {/* Popular badge */}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Most Popular
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-bolt-elements-textPrimary">{tierData.name}</h3>
                <p className="text-sm text-bolt-elements-textSecondary mt-1">{tierData.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-bolt-elements-textPrimary">${tierData.price}</span>
                    <span className="text-bolt-elements-textSecondary ml-2">/month</span>
                </div>
                {tierData.priceYearly && (
                    <p className="text-sm text-bolt-elements-textSecondary mt-1">
                        or ${tierData.priceYearly}/year (save ${tierData.price * 12 - tierData.priceYearly})
                    </p>
                )}
            </div>

            {/* Features */}
            <div className="flex-1 mb-6">
                <ul className="space-y-3">
                    {/* Usage limits */}
                    <li className="flex items-start gap-2">
                        <CheckIcon />
                        <span className="text-sm text-bolt-elements-textSecondary">
                            {tierData.messagesPerDay === Infinity
                                ? 'Unlimited messages'
                                : `${tierData.messagesPerDay} messages per day`}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckIcon />
                        <span className="text-sm text-bolt-elements-textSecondary">
                            {tierData.projects === Infinity ? 'Unlimited projects' : `${tierData.projects} project`}
                        </span>
                    </li>

                    {/* Key features */}
                    {tier === 'free' && (
                        <>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Basic intent extraction</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Understanding Card (view only)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Community support</span>
                            </li>
                        </>
                    )}

                    {tier === 'pro' && (
                        <>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Advanced vector options</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Full graph visualization</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Drift detection & nudges</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">PDF export</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Priority support</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Claude 3.5 Sonnet</span>
                            </li>
                        </>
                    )}

                    {tier === 'enterprise' && (
                        <>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Everything in Pro</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Team collaboration</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Custom AI models</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">SSO integration</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">Dedicated support</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon />
                                <span className="text-sm text-bolt-elements-textSecondary">SLA guarantees</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* CTA */}
            <Button
                variant={isPopular ? 'primary' : 'secondary'}
                onClick={() => onUpgrade?.(tier)}
                disabled={isCurrent}
                className="w-full"
            >
                {isCurrent ? 'Current Plan' : tier === 'free' ? 'Get Started' : 'Upgrade'}
            </Button>
        </div>
    );
});

TierCard.displayName = 'TierCard';

interface TierComparisonProps {
    currentTier?: TierName;
    onUpgrade?: (tier: TierName) => void;
}

export const TierComparison = memo(({ currentTier = 'free', onUpgrade }: TierComparisonProps) => {
    return (
        <div className="w-full max-w-6xl mx-auto p-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Choose Your Plan</h2>
                <p className="text-bolt-elements-textSecondary text-lg">
                    Start free, upgrade when you need more power
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <TierCard tier="free" currentTier={currentTier} onUpgrade={onUpgrade} />
                <TierCard tier="pro" currentTier={currentTier} onUpgrade={onUpgrade} />
                <TierCard tier="enterprise" currentTier={currentTier} onUpgrade={onUpgrade} />
            </div>

            <div className="mt-12 text-center">
                <p className="text-sm text-bolt-elements-textSecondary">
                    All plans include access to the core Gence IDE and AI-powered development features
                </p>
            </div>
        </div>
    );
});

TierComparison.displayName = 'TierComparison';
