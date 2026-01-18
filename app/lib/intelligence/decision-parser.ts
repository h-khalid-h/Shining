import type { Message } from '~/types/message';
import type { DecisionPoint, DecisionOption } from '~/components/intelligence/DecisionCards';

/**
 * Detects if an AI message contains a list of options
 * Returns Decision Card data if detected, null otherwise
 */
export function detectOptionsInMessage(content: string): DecisionPoint | null {
    // Skip if already a decision card
    if (content.startsWith('__DECISION_CARD__')) {
        return null;
    }

    const lines = content.split('\n');
    const options: DecisionOption[] = [];
    let currentOption: Partial<DecisionOption> | null = null;
    let question = '';

    // Detection patterns
    const optionHeaderPattern = /^\*\*(?:Option\s+\d+:|(?:\d+\.)\s)?\s*(.+?)\*\*/i;
    const prosPattern = /^(?:-\s)?(?:Pros?|Benefits?|Advantages?|✓)\s*:\s*(.+)/i;
    const consPattern = /^(?:-\s)?(?:Cons?|Drawbacks?|Disadvantages?|✗)\s*:\s*(.+)/i;
    const effortPattern = /^(?:-\s)?(?:Effort|Complexity)\s*:\s*(low|medium|high)/i;
    const descPattern = /^(?:-\s)?(?:Description|About)\s*:\s*(.+)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect question
        if (line.includes('?') && !question && i < 5) {
            question = line;
            continue;
        }

        // Detect option header
        const headerMatch = line.match(optionHeaderPattern);
        if (headerMatch) {
            // Save previous option if exists
            if (currentOption && currentOption.label) {
                options.push(completeOption(currentOption));
            }

            // Start new option
            const label = headerMatch[1].trim();
            currentOption = {
                id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                label,
                description: '',
                pros: [],
                cons: [],
                effort: 'medium',
            };
            continue;
        }

        // Parse option details
        if (currentOption) {
            const prosMatch = line.match(prosPattern);
            const consMatch = line.match(consPattern);
            const effortMatch = line.match(effortPattern);
            const descMatch = line.match(descPattern);

            if (prosMatch) {
                const items = prosMatch[1].split(',').map(s => s.trim()).filter(Boolean);
                currentOption.pros = [...(currentOption.pros || []), ...items];
            } else if (consMatch) {
                const items = consMatch[1].split(',').map(s => s.trim()).filter(Boolean);
                currentOption.cons = [...(currentOption.cons || []), ...items];
            } else if (effortMatch) {
                currentOption.effort = effortMatch[1] as 'low' | 'medium' | 'high';
            } else if (descMatch) {
                currentOption.description = descMatch[1];
            } else if (line.startsWith('- ') && (currentOption.pros?.length === 0) && (currentOption.cons?.length === 0)) {
                // First bullet after label is likely description
                if (!currentOption.description) {
                    currentOption.description = line.substring(2).trim();
                }
            }
        }
    }

    // Save last option
    if (currentOption && currentOption.label) {
        options.push(completeOption(currentOption));
    }

    // Need at least 2 options to make a decision card
    if (options.length < 2) {
        return null;
    }

    // Determine decision type
    const lowerContent = content.toLowerCase();
    let type: DecisionPoint['type'] = 'general';

    if (lowerContent.includes('architecture') || lowerContent.includes(' pattern')) {
        type = 'architecture';
    } else if (lowerContent.includes(' library') || lowerContent.includes(' framework')) {
        type = 'library';
    } else if (lowerContent.includes(' approach') || lowerContent.includes(' method')) {
        type = 'approach';
    } else if (lowerContent.includes(' design') || lowerContent.includes(' style')) {
        type = 'design';
    }

    return {
        type,
        question: question || 'Which option works best for you?',
        options,
        recommended: options[0]?.id, // First option as default
    };
}

/**
 * Complete partial option with defaults
 */
function completeOption(partial: Partial<DecisionOption>): DecisionOption {
    return {
        id: partial.id || 'option',
        label: partial.label || 'Option',
        description: partial.description || '',
        pros: partial.pros || [],
        cons: partial.cons || [],
        effort: partial.effort || 'medium',
    };
}

/**
 * Parse Decision Card from AI message
 * Handles both formats: explicit __DECISION_CARD__ and auto-detected options
 */
export function parseDecisionCard(content: string): DecisionPoint | null {
    const trimmed = content.trim();

    // Check for explicit decision or question card format
    if (trimmed.includes('__DECISION_CARD__') || trimmed.includes('__QUESTION_CARD__')) {
        try {
            const isQuestionCard = trimmed.includes('__QUESTION_CARD__');
            const prefix = isQuestionCard ? '__QUESTION_CARD__' : '__DECISION_CARD__';

            //  Find the start of JSON (after prefix)
            const startIndex = trimmed.indexOf(prefix) + prefix.length;
            let jsonStr = trimmed.substring(startIndex).trim();

            // Handle case where JSON is in a code block
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to find JSON object boundaries
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}');

            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            const decision = JSON.parse(jsonStr) as DecisionPoint;

            // Validate that it has the required fields
            if (decision.type && decision.question && decision.options && decision.options.length >= 2) {
                return decision;
            }

            console.warn('Invalid card structure:', decision);
            return null;
        } catch (e) {
            console.error('Failed to parse card:', e);
            console.error('Content was:', content.substring(0, 200));
            return null;
        }
    }

    // Auto-detect options in content
    return detectOptionsInMessage(content);
}
