import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeComposeShapesGenerator} from './generator.ts';
import {ShapeComposeShapesGeneratorSchema, spec} from './spec.ts';

describe('ShapeComposeShapesGenerator spec integration', () => {
    let generator: ShapeComposeShapesGenerator;

    beforeEach(() => {
        generator = new ShapeComposeShapesGenerator();
        setSeed(42);
    });

    it('declares composition generally and structure as mathematical configuration', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeComposition]);
        expect(Object.keys(ShapeComposeShapesGeneratorSchema)).toEqual([
            'classify',
            'compositionStructure'
        ]);
    });

    it('resolves single-level labels into a depth-one tree', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeComposition,
            Area.Rectangle,
            Scope.SingleLevelComposition
        ])!;

        expect(stub.data.target).toBe('rectangle');
        expect(stub.data.compositionDepth).toBe(1);
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.Rectangle,
            Area.Triangle,
            Scope.SingleLevelComposition
        ]));
    });

    it('resolves multi-level labels into a depth-two tree', () => {
        const stub = generateWithLabels(generator, [
            Area.ShapeComposition,
            Area.Hexagon,
            Scope.MultiLevelComposition
        ])!;

        expect(stub.data.target).toBe('hexagon');
        expect(stub.data.components).toEqual(['trapezoid', 'trapezoid']);
        expect(stub.data.compositionDepth).toBe(2);
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.Hexagon,
            Area.Trapezoid,
            Area.Triangle,
            Scope.MultiLevelComposition
        ]));
    });
});
