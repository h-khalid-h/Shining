/**
 * DriftNudge Component
 * Shows helpful nudges when user drifts from their goal
 */

import { motion } from 'framer-motion';
import styles from './DriftNudge.module.css';
import type { DriftAlert } from '~/lib/intelligence/drift-detector';

export interface DriftNudgeProps {
    alert: DriftAlert;
    onAcknowledge: () => void;
    onAdjustGoal: () => void;
    onCreateVector: () => void;
}

export function DriftNudge({
    alert,
    onAcknowledge,
    onAdjustGoal,
    onCreateVector,
}: DriftNudgeProps) {
    const severityColors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
    };

    return (
        <motion.div
            className={`${styles.container} ${styles[alert.severity]}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.header}>
                <div className={styles.icon} style={{ color: severityColors[alert.severity] }}>
                    ⚠️
                </div>
                <div className={styles.content}>
                    <h4>{alert.message}</h4>
                    <p className={styles.recommendation}>{alert.recommendation}</p>
                </div>
            </div>

            <div className={styles.driftIndicator}>
                <div className={styles.driftLabel}>Drift from goal:</div>
                <div className={styles.driftBar}>
                    <motion.div
                        className={styles.driftFill}
                        style={{ backgroundColor: severityColors[alert.severity] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${alert.driftPercentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className={styles.driftValue}>{Math.round(alert.driftPercentage)}%</div>
            </div>

            {alert.suggestedActions.length > 0 && (
                <div className={styles.actions}>
                    <h5>Suggested actions:</h5>
                    <ul>
                        {alert.suggestedActions.map((action, i) => (
                            <li key={i}>{action}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={styles.buttons}>
                <button className={styles.secondaryButton} onClick={onAcknowledge}>
                    Got it
                </button>
                <button className={styles.secondaryButton} onClick={onCreateVector}>
                    Create new plan
                </button>
                <button className={styles.primaryButton} onClick={onAdjustGoal}>
                    Adjust goal
                </button>
            </div>
        </motion.div>
    );
}
