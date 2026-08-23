import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {GeometryPrimitivesGenerator} from './generator.ts';
import {
    GEOMETRY_PRIMITIVE_LABELS,
    GeometryPrimitivesGeneratorConfig
} from './spec.ts';

const generator = new GeometryPrimitivesGenerator();

const CASES = [
    [Area.PointConcept, 'point'],
    [Area.LineConcept, 'line'],
    [Area.LineSegment, 'line-segment'],
    [Area.RayConcept, 'ray'],
    [Area.RightAngle, 'right-angle'],
    [Area.AcuteAngle, 'acute-angle'],
    [Area.ObtuseAngle, 'obtuse-angle'],
    [Area.PerpendicularityRelation, 'perpendicular-lines'],
    [Area.ParallelismRelation, 'parallel-lines']
] as const;

describe('GeometryPrimitivesGenerator', () => {
    it('strictly requires a primitive label', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each(CASES)('emits only the canonical primitive kind for %s', (primitive, primitiveKind) => {
        expect(generator.generate({primitive})).toEqual({data: {primitiveKind}});
    });

    it('rejects unsupported primitive labels', () => {
        expect(generator.generate({primitive: 'unsupported'} as unknown as GeometryPrimitivesGeneratorConfig))
            .toBeNull();
    });

    it('declares every supported primitive exactly once', () => {
        expect(GEOMETRY_PRIMITIVE_LABELS).toHaveLength(9);
        expect(new Set(GEOMETRY_PRIMITIVE_LABELS).size).toBe(9);
        expect(CASES.map(([label]) => label)).toEqual([...GEOMETRY_PRIMITIVE_LABELS]);
    });
});
