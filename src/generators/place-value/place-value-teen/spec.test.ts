import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueTeenGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueTeenGeneratorSchema, spec} from './spec.ts';

describe('PlaceValueTeenGenerator Spec Integration', () => {
    let generator: PlaceValueTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueTeenGenerator();
        setSeed(42);
    });

    it('should generate place value teen problems from general labels', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.Sum,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
            expect(stub!.data.ones).toBeLessThanOrEqual(9);
            expect(stub!.data.target).toBe(10 + stub!.data.ones);
        }
    });

    it('declares sum rather than difference', () => {
        expect(spec.generalLabels).toContain(Area.Sum);
        expect(spec.generalLabels).not.toContain(Area.Difference);
    });

    it('supports both bounds of the teen-number range', () => {
        expect(extractSchemaLabels(PlaceValueTeenGeneratorSchema)).toEqual(expect.arrayContaining([
            Scope.NumbersLarger10,
            Scope.NumbersSmaller20
        ]));

        const stub = generateWithLabels(generator, [
            Area.Sum,
            Scope.NumbersLarger10,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.NumbersLarger10,
            Scope.NumbersSmaller20
        ]));
        expect(stub!.data.target).toBeGreaterThan(10);
        expect(stub!.data.target).toBeLessThan(20);
    });

    it('should throw an error if range configuration is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });
});
