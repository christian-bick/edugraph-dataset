import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
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
        expect(spec.generalLabels).toEqual([Area.ShapeRecognition]);
    });

    it('generates from general target labels with an empty schema', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeRecognition,
            Scope.ShapeAttributes
        ]);

        expect(stub).not.toBeNull();
    });

    it('tags each problem with exactly its runtime-selected shape', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.ShapeRecognition,
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
            Area.ShapeRecognition,
            Scope.ShapeAttributes,
            Scope.VertexCount
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.tags).toContain(Scope.VertexCount);
    });

    it('resolves the equal-face-count classification path', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeRecognition,
            Scope.ShapeAttributes,
            Scope.FaceCount,
            Scope.Equal
        ])!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data).toMatchObject({attribute: 'equal-faces', requiredCount: 6});
        expect(stub.tags).toEqual(expect.arrayContaining([Scope.FaceCount, Scope.Equal, Area.Cube]));
    });
});
