import { memo } from 'react';

interface Feature {
    name: string;
    gence: boolean;
    boltNew: boolean;
    cursor: boolean;
    copilot: boolean;
    description: string;
}

const features: Feature[] = [
    {
        name: 'AI Code Generation',
        gence: true,
        boltNew: true,
        cursor: true,
        copilot: true,
        description: 'Generate code from natural language',
    },
    {
        name: 'Intent Extraction',
        gence: true,
        boltNew: false,
        cursor: false,
        copilot: false,
        description: 'Automatically understand your goals and constraints',
    },
    {
        name: 'Goal Tracking',
        gence: true,
        boltNew: false,
        cursor: false,
        copilot: false,
        description: 'Keep track of your project objectives',
    },
    {
        name: 'Drift Detection',
        gence: true,
        boltNew: false,
        cursor: false,
        copilot: false,
        description: 'Get alerted when you veer off course',
    },
    {
        name: 'Knowledge Graph',
        gence: true,
        boltNew: false,
        cursor: false,
        copilot: false,
        description: 'Persistent decision history and learning',
    },
    {
        name: 'Strategic Planning',
        gence: true,
        boltNew: false,
        cursor: false,
        copilot: false,
        description: 'AI-generated strategic path options',
    },
    {
        name: 'Browser-Based IDE',
        gence: true,
        boltNew: true,
        cursor: false,
        copilot: false,
        description: 'No installation required',
    },
];

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
        />
    </svg>
);

export const CompetitiveComparison = memo(() => {
    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-bolt-elements-borderColor">
                            <th className="text-left py-4 px-4 font-semibold">Feature</th>
                            <th className="text-center py-4 px-4">
                                <div className="font-bold text-accent-500 text-lg">Gence</div>
                            </th>
                            <th className="text-center py-4 px-4 text-bolt-elements-textSecondary">
                                Bolt.new
                            </th>
                            <th className="text-center py-4 px-4 text-bolt-elements-textSecondary">
                                Cursor
                            </th>
                            <th className="text-center py-4 px-4 text-bolt-elements-textSecondary">
                                Copilot
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((feature, index) => (
                            <tr
                                key={feature.name}
                                className={`border-b border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1 transition-colors ${index % 2 === 0 ? 'bg-bolt-elements-background-depth-2/30' : ''
                                    }`}
                            >
                                <td className="py-4 px-4">
                                    <div className="font-medium text-bolt-elements-textPrimary">{feature.name}</div>
                                    <div className="text-sm text-bolt-elements-textSecondary mt-1">
                                        {feature.description}
                                    </div>
                                </td>
                                <td className="text-center py-4 px-4">
                                    {feature.gence ? (
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                                            <CheckIcon />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xl">—</span>
                                    )}
                                </td>
                                <td className="text-center py-4 px-4">
                                    {feature.boltNew ? (
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                                            <CheckIcon />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xl">—</span>
                                    )}
                                </td>
                                <td className="text-center py-4 px-4">
                                    {feature.cursor ? (
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                                            <CheckIcon />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xl">—</span>
                                    )}
                                </td>
                                <td className="text-center py-4 px-4">
                                    {feature.copilot ? (
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                                            <CheckIcon />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xl">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-6 bg-accent-500/10 border border-accent-500/20 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-bolt-elements-textPrimary">
                    Unique Value Proposition
                </h3>
                <p className="text-bolt-elements-textSecondary leading-relaxed">
                    Gence is the only AI IDE that keeps you <strong className="text-accent-500">strategically aligned</strong>{' '}
                    with your goals through intelligent intent extraction, proactive drift detection, and persistent knowledge
                    graphs. While other tools just generate code, Gence ensures you're building the <em>right</em> thing.
                </p>
            </div>
        </div>
    );
});

CompetitiveComparison.displayName = 'CompetitiveComparison';
