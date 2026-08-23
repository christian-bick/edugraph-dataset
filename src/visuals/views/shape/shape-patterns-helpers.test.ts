import {describe, expect, it} from 'vitest';
import {ShapePatternProblem} from '../../../types/problems.ts';
import {
    buildShapePatternPresentation,
    isTermWithheld,
    shouldRevealEvidence,
    shouldRevealExplanation,
    validateShapePattern
} from './shape-patterns-helpers.ts';

function growthProblem(): ShapePatternProblem {
    return {
        patternKind: 'growth-parity',
        recurrence: {
            kind: 'add-square',
            initialSquareCount: 1,
            squareCountIncrease: 1
        },
        sequence: Array.from({length: 6}, (_, index) => ({
            position: index + 1,
            tokens: Array.from({length: index + 1}, () => ({
                shape: 'square' as const,
                orientation: 0 as const
            }))
        })),
        emergentFeature: {kind: 'position-count-parity'}
    };
}

function rotationProblem(): ShapePatternProblem {
    const orientations = [0, 90, 180, 270, 0, 90] as const;
    return {
        patternKind: 'rotation-axis',
        recurrence: {
            kind: 'quarter-turn-clockwise',
            initialOrientation: 0,
            quarterTurnsPerTerm: 1
        },
        sequence: orientations.map((orientation, index) => ({
            position: index + 1,
            tokens: [{shape: 'triangle', orientation}]
        })),
        emergentFeature: {kind: 'position-axis-parity'}
    };
}

describe('shape-pattern view helpers', () => {
    it.each(['generate', 'identify', 'explain'] as const)(
        'projects a complete %s task from the same neutral growth pattern',
        task => {
            const presentation = buildShapePatternPresentation(growthProblem(), task, 17);
            expect(presentation.sequence).toHaveLength(6);
            expect(presentation.givenTermCount).toBe(4);
            expect(presentation.rule).toContain('Add 1 square');
            expect(presentation.feature).toContain('Odd-positioned');
            expect(presentation.evidence).toHaveLength(2);
            expect(presentation.explanation).toContain('Adding 1 switches odd to even');
            expect(presentation.featureOptions).toContain(presentation.feature);
            expect(presentation.prompt).not.toBe('');
        }
    );

    it('derives rotation captions, feature, evidence, and explanation from typed mathematics', () => {
        const presentation = buildShapePatternPresentation(rotationProblem(), 'explain', 29);
        expect(presentation.sequence.map(term => term.caption)).toEqual([
            'Triangle points up',
            'Triangle points right',
            'Triangle points down',
            'Triangle points left',
            'Triangle points up',
            'Triangle points right'
        ]);
        expect(presentation.feature).toContain('odd positions point vertically');
        expect(presentation.evidence[0].observation).toContain('up, down, and up');
        expect(presentation.explanation).toContain('switches the triangle');
    });

    it('shuffles identification options deterministically from the render seed', () => {
        const data = growthProblem();
        expect(buildShapePatternPresentation(data, 'identify', 17).featureOptions)
            .toEqual(buildShapePatternPresentation(data, 'identify', 17).featureOptions);
        const orders = new Set(Array.from({length: 40}, (_, seed) => (
            buildShapePatternPresentation(data, 'identify', seed).featureOptions.join('|')
        )));
        expect(orders.size).toBeGreaterThan(1);
    });

    it('rejects incomplete sequences, contradictory recurrence, geometry, and invalid seeds', () => {
        const incomplete = growthProblem();
        incomplete.sequence.pop();
        expect(() => validateShapePattern(incomplete)).toThrow();

        const invalidRecurrence = growthProblem();
        if (invalidRecurrence.patternKind !== 'growth-parity') throw new Error('Expected growth pattern.');
        invalidRecurrence.recurrence.squareCountIncrease = 2 as 1;
        expect(() => validateShapePattern(invalidRecurrence)).toThrow();

        const invalidGeometry = rotationProblem();
        invalidGeometry.sequence[1].tokens[0].orientation = 0;
        expect(() => validateShapePattern(invalidGeometry)).toThrow();

        expect(() => buildShapePatternPresentation(growthProblem(), 'identify', 1.5)).toThrow();
    });

    it('withholds and reveals only the fields owned by each view mode', () => {
        expect(isTermWithheld('generate', 4, false)).toBe(false);
        expect(isTermWithheld('generate', 5, false)).toBe(true);
        expect(isTermWithheld('generate', 6, true)).toBe(false);
        expect(isTermWithheld('identify', 5, false)).toBe(false);

        expect(shouldRevealEvidence('identify', false)).toBe(false);
        expect(shouldRevealEvidence('identify', true)).toBe(true);
        expect(shouldRevealEvidence('generate', true)).toBe(false);
        expect(shouldRevealExplanation('explain', false)).toBe(false);
        expect(shouldRevealExplanation('explain', true)).toBe(true);
        expect(shouldRevealExplanation('identify', true)).toBe(false);
    });
});
