import {describe, expect, it} from 'vitest';
import {ShapeComposeShapesProblem} from '../../../../types/problems.ts';
import {
    shapeCompositionDiagramTarget,
    shapeCompositionLabel,
    shapeCompositionOptions,
    validateShapeComposition
} from './presentation.ts';

const rectangle: ShapeComposeShapesProblem = {
    compositionTree: {
        kind: 'composite',
        shape: 'rectangle',
        inputs: [
            {kind: 'primitive', shape: 'triangle'},
            {kind: 'primitive', shape: 'triangle'}
        ]
    },
    compositionDepth: 1
};

describe('shape composition presentation', () => {
    it.each([
        ['small-triangle', 'smaller triangle', 'triangle'],
        ['tiny-triangle', 'tiny triangle', 'triangle'],
        ['eighth-circle-piece', 'eighth-circle piece', 'quarter-circle'],
        ['sixteenth-circle-piece', 'sixteenth-circle piece', 'quarter-circle'],
        ['small-cube', 'smaller cube', 'cube'],
        ['half-cone', 'half-cone', 'cone'],
        ['quarter-cone-piece', 'quarter-cone piece', 'cone'],
        ['short-cylinder', 'shorter cylinder', 'cylinder'],
        ['cylinder-segment', 'cylinder segment', 'cylinder']
    ] as const)('maps %s to explicit phrase and diagram semantics', (id, label, diagramTarget) => {
        expect(shapeCompositionLabel(id)).toBe(label);
        expect(shapeCompositionDiagramTarget(id)).toBe(diagramTarget);
    });

    it('derives the correct choice and target-specific distractor from the tree', () => {
        validateShapeComposition(rectangle);
        expect(shapeCompositionOptions(rectangle, 0)).toEqual([
            {id: 'correct', label: 'Two triangles', correct: true},
            {id: 'distractor', label: 'Two circles', correct: false}
        ]);
        expect(shapeCompositionOptions(rectangle, 1)).toEqual([
            {id: 'distractor', label: 'Two circles', correct: false},
            {id: 'correct', label: 'Two triangles', correct: true}
        ]);

        const prism: ShapeComposeShapesProblem = {
            compositionTree: {
                kind: 'composite',
                shape: 'rectangular-prism',
                inputs: [
                    {kind: 'primitive', shape: 'cube'},
                    {kind: 'primitive', shape: 'cube'}
                ]
            },
            compositionDepth: 1
        };
        expect(shapeCompositionOptions(prism, 0).map(option => option.label))
            .toEqual(['Two cubes', 'Two spheres']);
    });

    it('derives multi-level choice language without a payload projection', () => {
        const data: ShapeComposeShapesProblem = {
            compositionTree: {
                kind: 'composite',
                shape: 'triangle',
                inputs: [
                    {
                        kind: 'composite',
                        shape: 'small-triangle',
                        inputs: [
                            {kind: 'primitive', shape: 'tiny-triangle'},
                            {kind: 'primitive', shape: 'tiny-triangle'}
                        ]
                    },
                    {
                        kind: 'composite',
                        shape: 'small-triangle',
                        inputs: [
                            {kind: 'primitive', shape: 'tiny-triangle'},
                            {kind: 'primitive', shape: 'tiny-triangle'}
                        ]
                    }
                ]
            },
            compositionDepth: 2
        };

        validateShapeComposition(data);
        expect(shapeCompositionOptions(data, 0).map(option => option.label))
            .toEqual(['Two smaller triangles', 'Two squares']);
    });

    it.each([
        {
            ...rectangle,
            compositionTree: {
                ...rectangle.compositionTree,
                inputs: [
                    {kind: 'primitive', shape: 'triangle'},
                    {kind: 'primitive', shape: 'square'}
                ]
            }
        },
        {...rectangle, compositionDepth: 2},
        {
            ...rectangle,
            compositionTree: {...rectangle.compositionTree, shape: 'unknown-shape'}
        }
    ])('rejects a non-canonical composition %#', data => {
        expect(() => validateShapeComposition(data as ShapeComposeShapesProblem)).toThrow();
    });
});
