import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueBundlesGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('PlaceValueBundlesGenerator spec integration', () => {
    const generator = new PlaceValueBundlesGenerator();

    it('declares multiples of ten as an invariant capability', () => {
        expect(spec.generalLabels).toContain(Scope.MultiplesOf10);
        expect(generator.schema).not.toHaveProperty('useMultipleTens');
    });

    it('resolves multiples of ten into bundle counts', () => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Scope.MultiplesOf10,
            Scope.NumbersSmaller100,
            Scope.NumbersWithoutNegatives
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe(stub!.data.tens * 10);
        expect(stub!.data.target % 10).toBe(0);
    });

    it('resolves the Grade 1 exact-one-ten labels through the inclusive range bound', () => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Scope.MultiplesOf10,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10,
            Scope.PhysicalNumbers
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data).toEqual({
            tens: 1,
            ones: 0,
            target: 10
        });
        expect(stub!.tags).toContain(Scope.NumbersSmaller10);
    });
});
