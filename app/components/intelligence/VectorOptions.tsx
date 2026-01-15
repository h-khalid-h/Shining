/**
 * VectorOptions Component
 * Displays strategic path options for users to choose from
 */

import { motion } from 'framer-motion';
import styles from './VectorOptions.module.css';
import type { Vector } from '~/lib/intelligence/vector-generator';

export interface VectorOptionsProps {
    vectors: Vector[];
    onSelect: (vector: Vector) => void;
    onDismiss: () => void;
}

export function VectorOptions({ vectors, onSelect, onDismiss }: VectorOptionsProps) {
    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.header}>
                <h3>I see a few ways to approach this:</h3>
                <button className={styles.dismissButton} onClick={onDismiss} aria-label="Dismiss">
                    ×
                </button>
            </div>

            <div className={styles.vectorList}>
                {vectors.map((vector, index) => (
                    <VectorCard
                        key={vector.id}
                        vector={vector}
                        index={index}
                        onSelect={() => onSelect(vector)}
                    />
                ))}
            </div>
        </motion.div>
    );
}

interface VectorCardProps {
    vector: Vector;
    index: number;
    onSelect: () => void;
}

function VectorCard({ vector, index, onSelect }: VectorCardProps) {
    return (
        <motion.div
            className={styles.vectorCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={onSelect}
        >
            <div className={styles.vectorHeader}>
                <h4>{vector.description}</h4>
                <span className={styles.confidence}>{vector.confidence}% confident</span>
            </div>

            <p className={styles.approach}>{vector.approach}</p>

            <div className={styles.tradeoffs}>
                <TradeoffBar label="Speed" value={vector.tradeoffs.speed} color="#3b82f6" />
                <TradeoffBar label="Cost" value={vector.tradeoffs.cost} color="#10b981" />
                <TradeoffBar label="Quality" value={vector.tradeoffs.quality} color="#8b5cf6" />
                <TradeoffBar label="Risk" value={vector.tradeoffs.risk} color="#ef4444" />
            </div>

            <div className={styles.steps}>
                <h5>Key Steps:</h5>
                <ol>
                    {vector.steps.slice(0, 3).map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            </div>

            <div className={styles.footer}>
                <span className={styles.duration}>Est. {vector.estimatedDuration}</span>
                <button className={styles.selectButton}>Choose this path →</button>
            </div>
        </motion.div>
    );
}

interface TradeoffBarProps {
    label: string;
    value: number;
    color: string;
}

function TradeoffBar({ label, value, color }: TradeoffBarProps) {
    return (
        <div className={styles.tradeoffBar}>
            <span className={styles.tradeoffLabel}>{label}</span>
            <div className={styles.tradeoffTrack}>
                <motion.div
                    className={styles.tradeoffFill}
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                />
            </div>
            <span className={styles.tradeoffValue}>{value}/10</span>
        </div>
    );
}
