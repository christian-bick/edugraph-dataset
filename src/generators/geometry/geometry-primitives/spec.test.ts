import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {GeometryPrimitivesGenerator} from './generator.ts';
import {spec} from './spec.ts';

const CASES = [
    [Area.PointConcept, 'point', 'e8a980fa', 'f0577bac', false],
    [Area.LineConcept, 'line', '81f0bf0d', '52c56b78', true],
    [Area.LineSegment, 'line-segment', 'a779de96', '80af2927', true],
    [Area.RayConcept, 'ray', 'af25839f', '5185b3aa', true],
    [Area.RightAngle, 'right-angle', '0bccf16e', '0800aa71', true],
    [Area.AcuteAngle, 'acute-angle', 'bb9e0ae2', '16bafa93', true],
    [Area.ObtuseAngle, 'obtuse-angle', 'e1a725f0', 'b359f251', true],
    [Area.PerpendicularityRelation, 'perpendicular-lines', 'b8fa2b57', 'e9178e52', true],
    [Area.ParallelismRelation, 'parallel-lines', '3b658e7b', 'ce415298', true]
] as const;

describe('GeometryPrimitivesGenerator spec integration', () => {
    it('declares no invariant competency labels', () => {
        expect(spec.generalLabels).toEqual([]);
    });

    it.each(CASES)('resolves corrected drawing target for %s', (
        subject,
        kind,
        expectedDrawHash,
        _expectedIdentifyHash,
        usesLinearDrawing
    ) => {
        const labels = [
            ...(usesLinearDrawing ? [Area.LinearDrawing] : []),
            subject,
            Ability.VisualArticulation
        ];
        expect(labelSetHash(labels)).toBe(expectedDrawHash);
        const stub = generateWithLabels(new GeometryPrimitivesGenerator(), labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.primitiveKind).toBe(kind);
        expect(stub!.tags).toEqual([subject]);
    });

    it.each(CASES)('resolves corrected identification target for %s', (
        subject,
        kind,
        _expectedDrawHash,
        expectedIdentifyHash
    ) => {
        const labels = [subject, Ability.VisualRecognition];
        expect(labelSetHash(labels)).toBe(expectedIdentifyHash);
        const stub = generateWithLabels(new GeometryPrimitivesGenerator(), labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.primitiveKind).toBe(kind);
        expect(stub!.tags).toEqual([subject]);
    });
});
