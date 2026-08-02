import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueBundlesGenerator} from './generator.ts';

describe('PlaceValueBundlesGenerator spec integration', () => {
    const generator = new PlaceValueBundlesGenerator();

    it('resolves the single-ten place-value competency', () => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Scope.NumbersSmaller20,
            Scope.NumbersWithoutNegatives
        ]);
        expect(stub?.data).toEqual({tens: 1, ones: 0, target: 10});
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
        expect(stub!.tags).toContain(Scope.MultiplesOf10);
    });
});
