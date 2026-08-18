import {Ability, Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {PLANE_SHAPE_LABELS, shapeNameFromLabel} from '../helpers.ts';
import {ShapeClassifyAttributesGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ShapeClassifyAttributesGenerator spec integration', () => {
    let generator: ShapeClassifyAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyAttributesGenerator();
        setSeed(42);
    });

    it('declares the shape-recognition and shape-attribute capabilities', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeClassification]);
    });

    it('generates from general target labels with an empty schema', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes
        ]);

        expect(stub).not.toBeNull();
    });

    it('generates the quadrilateral subsumption target', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeSubsumption,
            Scope.ShapeAttributes,
            Ability.ConceptClassification,
            Ability.VisualRecognition,
            Area.Rhombus
        ]);

        expect(stub?.data.task).toBe('classify-quadrilateral-subcategory');
    });

    it('tags each problem with exactly its runtime-selected shape', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.ShapeClassification,
                Scope.ShapeAttributes
            ])!;
            if (!('shape' in stub.data)) throw new Error('Expected a legacy classification problem.');
            const shape = stub.data.shape;
            const expectedLabel = PLANE_SHAPE_LABELS.find(
                label => shapeNameFromLabel(label) === shape
            );

            expect(stub.tags).toEqual([expectedLabel, Scope.ShapeAttributes]);
        }
    });

    it('resolves the vertex-count classification path', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.VertexCount
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.tags).toContain(Scope.VertexCount);
    });

    it('resolves the angle-count classification path', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.AngleCount,
            Ability.ConceptClassification
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('angles');
        expect(stub.tags).toContain(Scope.AngleCount);
        expect(stub.data.options.filter(option => option.satisfies)).toHaveLength(1);
    });

    it('resolves the equal-face-count classification path', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.FaceCount,
            Scope.Equal
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data).toMatchObject({attribute: 'equal-faces', requiredCount: 6});
        expect(stub.tags).toEqual(expect.arrayContaining([Scope.FaceCount, Scope.Equal, Area.Cube]));
    });

    it.each([
        [Area.ParallelismRelation, 'classify-line-relation', 'de328e3a'],
        [Area.PerpendicularityRelation, 'classify-line-relation', 'f9f6aed4'],
        [Area.RightAngle, 'classify-angle-size', 'e71f1a71'],
        [Area.AcuteAngle, 'classify-angle-size', '01ffd3a5'],
        [Area.ObtuseAngle, 'classify-angle-size', '9764bcf9']
    ] as const)('resolves the corrected Grade 4 %s classification target', (
        criterion,
        task,
        expectedHash
    ) => {
        const labels = [
            Area.ShapeClassification,
            criterion,
            Scope.ShapeAttributes,
            Ability.ConceptClassification
        ];
        expect(labelSetHash(labels)).toBe(expectedHash);
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.tags).toContain(criterion);
    });

    it('resolves the corrected Grade 4 right-triangle category target', () => {
        const labels = [
            Area.ShapeSubsumption,
            Area.RightTriangle,
            Area.RightAngle,
            Scope.ShapeAttributes,
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ];
        expect(labelSetHash(labels)).toBe('7352de55');
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('classify-right-triangle-category');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.ShapeSubsumption,
            Area.RightTriangle,
            Area.RightAngle
        ]));
    });

    it.each([
        [Area.ParallelismRelation, 'classify-line-relation'],
        [Area.PerpendicularityRelation, 'classify-line-relation'],
        [Area.RightAngle, 'classify-angle-size'],
        [Area.AcuteAngle, 'classify-angle-size'],
        [Area.ObtuseAngle, 'classify-angle-size']
    ] as const)('generates a truthful classification payload for overlapping 4.G.A.1 %s recognition', (
        criterion,
        task
    ) => {
        const stub = generateWithLabels(generator, [criterion, Ability.VisualRecognition]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
    });
});
