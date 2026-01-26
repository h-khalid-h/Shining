import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '@clerk/react-router';
import { motion } from 'framer-motion';
import { CompetitiveComparison } from '~/components/landing/CompetitiveComparison';

export default function Onboarding() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [north, setNorth] = useState('');
    const [role, setRole] = useState('');
    const [showComparison, setShowComparison] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else {
            // Store initial North context (simulated for now, essentially priming the chat)
            // In a real app, we'd save this to the graph database here
            navigate('/?initialNorth=' + encodeURIComponent(north));
        }
    };

    return (
        <div className="min-h-screen bg-bolt-elements-background-depth-1 overflow-y-auto">
            {/* Hero Section with Onboarding Form */}
            <div className="flex items-center justify-center p-4 min-h-screen">
                <div className="max-w-md w-full bg-bolt-elements-background-depth-2 rounded-xl shadow-2xl overflow-hidden border border-bolt-elements-borderColor">

                    {/* Progress Bar */}
                    <div className="h-1 bg-bolt-elements-background-depth-3 w-full">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: "0%" }}
                            animate={{ width: step === 1 ? "50%" : "100%" }}
                        />
                    </div>

                    <div className="p-8">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">
                                Welcome, {user?.firstName || 'Creator'}
                            </h1>
                            <p className="text-bolt-elements-textSecondary">
                                Let's set up your Intelligence Layer.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {step === 1 ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                        What is your primary role?
                                    </label>
                                    <div className="space-y-3 mb-6">
                                        {['Developer', 'Product Manager', 'Founder', 'Student'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`w-full p-3 text-left rounded-lg border transition-all ${role === r
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                                    : 'border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive'
                                                    }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                        What are you building today? (Your "North")
                                    </label>
                                    <textarea
                                        value={north}
                                        onChange={(e) => setNorth(e.target.value)}
                                        placeholder="e.g., A real-time dashboard for crypto trading..."
                                        className="w-full p-3 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32 mb-6 text-bolt-elements-textPrimary resize-none"
                                        required
                                    />
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={step === 1 && !role}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                            >
                                {step === 1 ? 'Next Step →' : 'Initialize Gence'}
                            </button>

                            {step === 1 && (
                                <button
                                    type="button"
                                    onClick={() => setShowComparison(!showComparison)}
                                    className="w-full py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                                >
                                    {showComparison ? '↑ Hide' : '↓ Why Gence?'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Competitive Comparison Section */}
            {showComparison && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-20 px-4 bg-bolt-elements-background-depth-2"
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">
                                Why Choose Gence?
                            </h2>
                            <p className="text-bolt-elements-textSecondary text-lg">
                                The only AI IDE with strategic intelligence built-in
                            </p>
                        </div>

                        <CompetitiveComparison />

                        <div className="mt-12 text-center">
                            <p className="text-bolt-elements-textSecondary mb-6">
                                Ready to build strategically?
                            </p>
                            <button
                                onClick={() => {
                                    setShowComparison(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Get Started →
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
