import {describe, expect, it} from 'vitest';
import {GeometryPrimitiveKind, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {isCompletedPrimitiveScene, isValidPrimitiveGuide} from '../primitive-validation.ts';
import {buildGeometryPrimitivesDrawingPresentation} from './helpers.ts';

const KINDS: readonly GeometryPrimitiveKind[] = [
    'point',
    'line',
    'line-segment',
    'ray',
    'right-angle',
    'acute-angle',
    'obtuse-angle',
    'perpendicular-lines',
    'parallel-lines'
];

describe('geometry primitives drawing presentation', () => {
    it.each(KINDS)('derives valid guide, solution, and prose for %s', primitiveKind => {
        const presentation = buildGeometryPrimitivesDrawingPresentation(
            {primitiveKind},
            primitiveKind !== 'point'
        );
        expect(presentation).not.toBeNull();
        expect(presentation!.drawingPrompt).not.toBe('');
        expect(presentation!.drawingAnswer).not.toBe('');
        expect(presentation!.drawingAnswerStatement).not.toBe('');
        expect(presentation!.drawingExplanation).not.toBe('');
        expect(isValidPrimitiveGuide(primitiveKind, presentation!.guideScene)).toBe(true);
        expect(isCompletedPrimitiveScene(primitiveKind, presentation!.solutionScene)).toBe(true);
    });

    it('rejects mismatched drawing capabilities and unsupported primitive kinds', () => {
        expect(buildGeometryPrimitivesDrawingPresentation({primitiveKind: 'point'}, true)).toBeNull();
        expect(buildGeometryPrimitivesDrawingPresentation({primitiveKind: 'line'}, false)).toBeNull();
        expect(buildGeometryPrimitivesDrawingPresentation(
            {primitiveKind: 'circle'} as unknown as GeometryPrimitivesProblem,
            true
        )).toBeNull();
    });
});
