import { useState, useEffect } from 'react';
import { DialogRoot, Dialog } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { analytics } from '~/lib/analytics/posthog';

interface TourStep {
    id: string;
    title: string;
    description: string;
    image?: string; // Optional illustration
    cta?: string; // Custom CTA text
}

const tourSteps: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Gence',
        description:
            'The AI IDE that keeps you strategically aligned with your goals. Unlike other AI coding assistants that just generate code, Gence understands your objectives and guides you throughout the development process.',
        cta: 'Show Me How',
    },
    {
        id: 'chat',
        title: 'Start with Your Goal',
        description:
            'Tell me what you want to build in natural language. I\'ll extract your intent, understand your constraints, and guide you through the process. Be specific about what you want to achieve.',
    },
    {
        id: 'understanding',
        title: 'Understanding Card',
        description:
            'After a few messages, I\'ll show what I understood about your goals and constraints in the Understanding Card. You can confirm, refine, or correct my understanding at any time.',
    },
    {
        id: 'vectors',
        title: 'Strategic Path Options',
        description:
            'I\'ll suggest different approaches to achieve your goal. Each vector represents a strategic option with its own trade-offs. Choose the path that best aligns with your priorities.',
    },
    {
        id: 'drift',
        title: 'Drift Detection',
        description:
            'If you start to veer off course from your original goal, I\'ll proactively alert you. This keeps you aligned and prevents wasted effort on the wrong things.',
    },
    {
        id: 'graph',
        title: 'Knowledge Graph',
        description:
            'Your decisions, progress, and learnings are stored in a persistent knowledge graph. View it anytime to see your journey and understand how your project evolved.',
    },
    {
        id: 'ready',
        title: 'Ready to Build Strategically',
        description:
            'You\'re all set! Start by describing what you want to build. I\'ll extract your intent, track your progress, and keep you aligned with your goals every step of the way.',
        cta: 'Start Building',
    },
];

export function IntelligenceTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem('gence_tour_completed');
        if (!hasSeenTour) {
            // Delay tour slightly to let the app load
            const timer = setTimeout(() => {
                setIsOpen(true);
                analytics.track('tour_started');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            analytics.track('tour_step_completed', { step: tourSteps[currentStep].id });
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        analytics.track('tour_skipped', { step: tourSteps[currentStep].id, totalSteps: tourSteps.length });
        setIsOpen(false);
    };

    const handleComplete = () => {
        localStorage.setItem('gence_tour_completed', 'true');
        analytics.track('tour_completed');
        setIsOpen(false);
    };

    const step = tourSteps[currentStep];
    const isLastStep = currentStep === tourSteps.length - 1;

    return (
        <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
            <Dialog className="max-w-2xl">
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">{step.title}</h2>
                            <span className="text-sm text-bolt-elements-textSecondary">
                                {currentStep + 1} / {tourSteps.length}
                            </span>
                        </div>
                        <p className="text-bolt-elements-textSecondary text-lg leading-relaxed">{step.description}</p>
                    </div>

                    {/* Optional image placeholder */}
                    {step.image && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
                            <img src={step.image} alt={step.title} className="w-full" />
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        <Button variant="ghost" onClick={handleSkip} className="text-bolt-elements-textSecondary">
                            Skip Tour
                        </Button>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button variant="secondary" onClick={handleBack}>
                                    Back
                                </Button>
                            )}
                            <Button variant="primary" onClick={handleNext}>
                                {step.cta || (isLastStep ? 'Get Started' : 'Next')}
                            </Button>
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        {tourSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-200 ${index === currentStep
                                        ? 'bg-accent-500 w-8'
                                        : index < currentStep
                                            ? 'bg-accent-300 w-2'
                                            : 'bg-gray-300 w-2'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </Dialog>
        </DialogRoot>
    );
}
