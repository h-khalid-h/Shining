import type { Message } from 'ai';
import type { DecisionPoint } from '~/components/intelligence/DecisionCards';
import { detectDecisionPoint, matchDecisionResponse } from '~/lib/intelligence/decision-detector';

export interface DecisionFlowState {
    pendingDecision: DecisionPoint | null;
    awaitingResponse: boolean;
}

/**
 * Handles decision flow logic for chat messages
 */
export class DecisionFlowHandler {
    private state: DecisionFlowState = {
        pendingDecision: null,
        awaitingResponse: false,
    };

    setState(newState: Partial<DecisionFlowState>) {
        this.state = { ...this.state, ...newState };
    }

    getState() {
        return this.state;
    }

    /**
     * Checks if message requires a decision and returns decision message if needed
     */
    checkForDecision(userMessage: string): Message | null {
        const decision = detectDecisionPoint(userMessage);

        if (decision && !this.state.awaitingResponse) {
            this.state.pendingDecision = decision;
            this.state.awaitingResponse = true;

            return {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `__DECISION_CARD__${JSON.stringify(decision)}`,
            };
        }

        return null;
    }

    /**
     * Handles user's decision selection
     */
    handleSelection(optionId: string): Message | null {
        if (!this.state.pendingDecision) return null;

        const { pendingDecision } = this.state;
        const selectedOption = pendingDecision.options.find(opt => opt.id === optionId);

        let confirmText = '';
        if (optionId === 'idk') {
            confirmText = "✓ I'll use the recommended approach based on best practices.";
        } else if (optionId === 'more') {
            confirmText = "Let me provide more alternatives. What specific aspects are you most concerned about?";
        } else if (selectedOption) {
            confirmText = `✓ Proceeding with: **${selectedOption.label}**`;
        }

        // Reset state
        this.state.pendingDecision = null;
        this.state.awaitingResponse = false;

        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: confirmText,
        };
    }

    /**
     * Checks if user typed a response matching a decision option
     */
    checkTextResponse(userMessage: string): Message | null {
        if (!this.state.awaitingResponse || !this.state.pendingDecision) {
            return null;
        }

        const matchedOption = matchDecisionResponse(userMessage, this.state.pendingDecision);
        if (matchedOption) {
            return this.handleSelection(matchedOption);
        }

        return null;
    }
}
