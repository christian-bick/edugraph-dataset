import {describe, expect, it} from 'vitest';
import {GeometryPrimitiveKind, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {isCompletedPrimitiveScene} from '../primitive-validation.ts';
import {PRIMITIVE_DISTRACTORS} from '../primitive-contract.ts';
import {buildGeometryPrimitivesIdentificationPresentation} from './helpers.ts';

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

describe('geometry primitives identification presentation', () => {
    it.each(KINDS)('derives one correct and three valid distractor diagrams for %s', primitiveKind => {
        const presentation = buildGeometryPrimitivesIdentificationPresentation({primitiveKind}, 9200);
        expect(presentation).not.toBeNull();
        expect(presentation!.identificationPrompt).not.toBe('');
        expect(presentation!.candidates.map(candidate => candidate.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(new Set(presentation!.candidates.map(candidate => candidate.kind))).toEqual(
            new Set([primitiveKind, ...PRIMITIVE_DISTRACTORS[primitiveKind]])
        );
        expect(presentation!.candidates.every(
            candidate => isCompletedPrimitiveScene(candidate.kind, candidate.scene)
        )).toBe(true);
        expect(presentation!.candidates.find(candidate => candidate.id === presentation!.correctCandidateId)?.kind)
            .toBe(primitiveKind);
        expect(presentation!.explanation).toContain(presentation!.definition);
    });

    it('is deterministic for one render seed and varies the answer position across seeds', () => {
        const data: GeometryPrimitivesProblem = {primitiveKind: 'ray'};
        expect(buildGeometryPrimitivesIdentificationPresentation(data, 17))
            .toEqual(buildGeometryPrimitivesIdentificationPresentation(data, 17));
        const correctIds = new Set(
            Array.from({length: 80}, (_, seed) => (
                buildGeometryPrimitivesIdentificationPresentation(data, seed)!.correctCandidateId
            ))
        );
        expect(correctIds).toEqual(new Set(['A', 'B', 'C', 'D']));
    });

    it('rejects invalid seeds and unsupported primitive kinds', () => {
        expect(buildGeometryPrimitivesIdentificationPresentation({primitiveKind: 'point'}, 1.5)).toBeNull();
        expect(buildGeometryPrimitivesIdentificationPresentation(
            {primitiveKind: 'circle'} as unknown as GeometryPrimitivesProblem,
            1
        )).toBeNull();
    });
});
