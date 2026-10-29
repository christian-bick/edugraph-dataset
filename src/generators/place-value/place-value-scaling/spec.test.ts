import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueScalingGenerator} from './generator.ts';
import {PlaceValueScalingGeneratorSchema, spec} from './spec.ts';

describe('PlaceValueScalingGenerator spec integration', () => {
    const generator = new PlaceValueScalingGenerator();

    it('declares every invariant mathematical capability without parameter overlap', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.PlaceValue,
            Area.ProportionalScaling,
            Area.Multiplication,
            Area.Division,
            Scope.Base10,
            Scope.NumbersSmaller1000000
        ]));
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersLarger100000);
        expect(PlaceValueScalingGeneratorSchema.hasZeroCoefficient[0]).toEqual([
            Scope.NumbersWithZero, Scope.NumbersWithoutZero
        ]);
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('honors %s in the complete coefficient strip', label => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [label]);
            expect(stub).not.toBeNull();
            expect(stub!.labels).toContain(label);
            expect(stub!.data.digits.includes(0)).toBe(label === Scope.NumbersWithZero);
        }
    });

    it('generates from the exact Grade 4 mathematical labels', () => {
        setSeed(37);
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Area.ProportionalScaling,
            Area.Multiplication,
            Area.Division,
            Scope.Base10,
            Scope.NumbersSmaller1000000
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('adjacent-place-scaling');
        expect(stub!.data.leftPlace.value).toBe(stub!.data.rightPlace.value * 10);
    });
});
