import type { Signal } from '~/lib/stores/graph';
import type { DriftAlert } from './drift-detector';

export interface DriftSnapshot {
    id: string;
    conversationId: string;
    messageIndex: number;
    driftScore: number;
    driftType: 'low' | 'medium' | 'high' | 'none';
    contextSnapshot: {
        north: any;
        bounds: any[];
        signal: Signal;
    };
    timestamp: number;
}

export interface DriftEvent {
    id: string;
    conversationId: string;
    eventType: 'drift_detected' | 'drift_resolved' | 'nudge_shown' | 'nudge_dismissed';
    driftScoreBefore: number;
    driftScoreAfter: number;
    userAction?: 'adjusted_goal' | 'created_vector' | 'dismissed';
    timestamp: number;
}

/**
 * Drift history manager using IndexedDB for local storage.
 * Tracks drift snapshots and events for historical analysis.
 */
export class DriftHistory {
    private dbName = 'meldon-drift-history';
    private version = 1;

    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create snapshots store
                if (!db.objectStoreNames.contains('snapshots')) {
                    const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
                    snapshotStore.createIndex('conversationId', 'conversationId', { unique: false });
                    snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create events store
                if (!db.objectStoreNames.contains('events')) {
                    const eventStore = db.createObjectStore('events', { keyPath: 'id' });
                    eventStore.createIndex('conversationId', 'conversationId', { unique: false });
                    eventStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async saveSnapshot(snapshot: Omit<DriftSnapshot, 'id'>): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction(['snapshots'], 'readwrite');
        const store = transaction.objectStore('snapshots');

        const fullSnapshot: DriftSnapshot = {
            ...snapshot,
            id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        await new Promise<void>((resolve, reject) => {
            const request = store.add(fullSnapshot);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveEvent(event: Omit<DriftEvent, 'id'>): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction(['events'], 'readwrite');
        const store = transaction.objectStore('events');

        const fullEvent: DriftEvent = {
            ...event,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        await new Promise<void>((resolve, reject) => {
            const request = store.add(fullEvent);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSnapshots(conversationId: string): Promise<DriftSnapshot[]> {
        const db = await this.getDB();
        const transaction = db.transaction(['snapshots'], 'readonly');
        const store = transaction.objectStore('snapshots');
        const index = store.index('conversationId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(conversationId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getEvents(conversationId: string): Promise<DriftEvent[]> {
        const db = await this.getDB();
        const transaction = db.transaction(['events'], 'readonly');
        const store = transaction.objectStore('events');
        const index = store.index('conversationId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(conversationId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
}

export const driftHistory = new DriftHistory();
