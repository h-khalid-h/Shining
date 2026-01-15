import { map } from 'nanostores';

/**
 * Graph Store - Frontend state for intelligence tracking
 * Stores North (intent), Bounds (constraints), and Signal (metrics)
 */

export interface NorthState {
    id: string;
    statement: string;
    confidence: number;
    locked: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BoundState {
    id: string;
    metric: 'time' | 'cost' | 'quality' | 'scope';
    value: string;
    threshold?: number;
    unit?: string;
    confidence: number;
    hard: boolean;
}

export interface SignalState {
    strength: number; // 0-100: Overall progress
    drift: number; // 0-100: Misalignment
    velocity: number; // Actions per day
    kineticComplete: number;
    kineticTotal: number;
    lastUpdate: string;
}

export interface GraphState {
    north: NorthState | null;
    bounds: BoundState[];
    signal: SignalState | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: GraphState = {
    north: null,
    bounds: [],
    signal: null,
    loading: false,
    error: null,
};

// Graph store
export const graphStore = map<GraphState>(initialState);

// Actions
export function setNorth(north: NorthState) {
    graphStore.setKey('north', north);
}

export function addBound(bound: BoundState) {
    const current = graphStore.get();
    graphStore.setKey('bounds', [...current.bounds, bound]);
}

export function setBounds(bounds: BoundState[]) {
    graphStore.setKey('bounds', bounds);
}

export function updateSignal(signal: SignalState) {
    graphStore.setKey('signal', signal);
}

export function setLoading(loading: boolean) {
    graphStore.setKey('loading', loading);
}

export function setError(error: string | null) {
    graphStore.setKey('error', error);
}

export function setGraphState(state: Partial<GraphState>) {
    const current = graphStore.get();
    graphStore.set({ ...current, ...state });
}

export function resetGraph() {
    graphStore.set(initialState);
}

// Selectors
export function getGraphState(): GraphState {
    return graphStore.get();
}

export function hasNorth(): boolean {
    return graphStore.get().north !== null;
}

export function getSignalStrength(): number {
    return graphStore.get().signal?.strength || 0;
}

export function isDrifting(): boolean {
    const drift = graphStore.get().signal?.drift || 0;
    return drift > 30; // Threshold for drift warning
}
