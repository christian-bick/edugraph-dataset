import {describe, expect, it} from 'vitest';
import {ShapePatternProblem} from '../../../types/problems.ts';
import {
    isTermWithheld,
    shouldRevealEvidence,
    shouldRevealExplanation,
    validateShapePattern
} from './shape-patterns-helpers.ts';

function growthProblem(task: ShapePatternProblem['task']): ShapePatternProblem {
    const common = {
        patternKind: 'growth-parity' as const,
        rule: 'Start with 1 square. Add 1 square to make each new figure.',
        sequence: Array.from({length: 6}, (_, index) => ({
            position: index + 1,
            tokens: Array.from({length: index + 1}, () => ({
                shape: 'square' as const,
                orientation: 0 as const
            })),
            caption: `${index + 1} squares`
        })),
        givenTermCount: 4,
        feature: 'Position parity matches square-count parity.',
        evidence: [
            {positions: [1, 3, 5], observation: 'Odd counts.'},
            {positions: [2, 4, 6], observation: 'Even counts.'}
        ],
        explanation: 'Adding one switches parity at every step.',
        prompt: 'Complete the task.'
    };

    if (task === 'generate') return {...common, task, responsePositions: [5, 6]};
    if (task === 'identify') {
        return {
            ...common,
            task,
            featureOptions: [common.feature, 'All counts are even.', 'The count never changes.']
        };
    }
    return {...common, task};
}

function rotationProblem(): ShapePatternProblem {
    const orientations = [0, 90, 180, 270, 0, 90] as const;
    return {
        task: 'explain',
        patternKind: 'rotation-axis',
        rule: 'Turn one quarter-turn clockwise.',
        sequence: orientations.map((orientation, index) => ({
            position: index + 1,
            tokens: [{shape: 'triangle', orientation}],
            caption: `Direction ${index + 1}`
        })),
        givenTermCount: 4,
        feature: 'Odd positions are vertical and even positions are horizontal.',
        evidence: [{positions: [1, 2, 3, 4, 5, 6], observation: 'The axis alternates.'}],
        explanation: 'Each turn switches the orientation axis.',
        prompt: 'Explain the feature.'
    };
}

describe('shape-pattern view helpers', () => {
    it.each(['generate', 'identify', 'explain'] as const)('accepts a complete %s payload', task => {
        expect(() => validateShapePattern(growthProblem(task))).not.toThrow();
    });

    it('accepts the asymmetric quarter-turn triangle sequence', () => {
        expect(() => validateShapePattern(rotationProblem())).not.toThrow();
    });

    it('rejects incomplete sequence, geometry, response, and options', () => {
        const incomplete = growthProblem('generate');
        incomplete.sequence.pop();
        expect(() => validateShapePattern(incomplete)).toThrow();

        const invalidGeometry = rotationProblem();
        invalidGeometry.sequence[1].tokens[0].orientation = 0;
        expect(() => validateShapePattern(invalidGeometry)).toThrow();

        const invalidResponse = growthProblem('generate');
        if (invalidResponse.task !== 'generate') throw new Error('Expected generation task.');
        invalidResponse.responsePositions = [4, 5];
        expect(() => validateShapePattern(invalidResponse)).toThrow();

        const invalidOptions = growthProblem('identify');
        if (invalidOptions.task !== 'identify') throw new Error('Expected identification task.');
        invalidOptions.featureOptions = ['Repeated', 'Repeated', 'Repeated'];
        expect(() => validateShapePattern(invalidOptions)).toThrow();
    });

    it('withholds only generation response terms in Question mode', () => {
        const generate = growthProblem('generate');
        expect(isTermWithheld(generate, 4, false)).toBe(false);
        expect(isTermWithheld(generate, 5, false)).toBe(true);
        expect(isTermWithheld(generate, 6, false)).toBe(true);
        expect(isTermWithheld(generate, 5, true)).toBe(false);
        expect(isTermWithheld(growthProblem('identify'), 5, false)).toBe(false);
    });

    it('reveals evidence and causal explanation only in their solution roles', () => {
        expect(shouldRevealEvidence(growthProblem('identify'), false)).toBe(false);
        expect(shouldRevealEvidence(growthProblem('identify'), true)).toBe(true);
        expect(shouldRevealEvidence(growthProblem('generate'), true)).toBe(false);
        expect(shouldRevealExplanation(growthProblem('explain'), false)).toBe(false);
        expect(shouldRevealExplanation(growthProblem('explain'), true)).toBe(true);
        expect(shouldRevealExplanation(growthProblem('identify'), true)).toBe(false);
    });
});
