import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionScaleComparisonProblem, FractionScaleRational} from '../../../types/problems.ts';
import {FractionScalingGenerator} from './generator.ts';
import type {FractionScalingGeneratorConfig} from './spec.ts';

const generator = new FractionScalingGenerator();
const profiles = ['greater', 'less', 'equal'] as const;
type Profile = typeof profiles[number];

const sample = (comparisonProfile: Profile, seed: string): FractionScaleComparisonProblem => {
    setSeed(seed);
    return generator.generate({comparisonProfile}).data;
};

const equal = (left: FractionScaleRational, right: FractionScaleRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
        === BigInt(right.numerator) * BigInt(left.denominator);

describe('fraction-scaling exact comparison model', () => {
    it.each(profiles)('constructs the %s relation and all exact witnesses', profile => {
        const instances = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            const data = sample(profile, `${profile}-${seed}`);
            const q = data.reference.numerator;
            const a = data.scaleFactor.numerator;
            const b = data.scaleFactor.denominator;
            instances.add(`${q}:${a}:${b}`);

            expect(data.kind).toBe('fraction-scale-comparison');
            expect(data.reference).toEqual({numerator: q, denominator: 1});
            expect(q).toBeGreaterThanOrEqual(2);
            expect(q).toBeLessThanOrEqual(5);
            expect(b).toBeGreaterThanOrEqual(2);
            expect(b).toBeLessThanOrEqual(6);
            expect(a).toBeGreaterThan(0);
            expect(a).toBeLessThan(2 * b);
            expect(data.product).toEqual({numerator: q * a, denominator: b});
            expect(data.onePart).toEqual({numerator: q, denominator: b});
            expect(data.partDifferenceCount).toBe(a - b);
            expect(data.wholeNumberAnalogy).toEqual({
                factor: 2,
                product: {numerator: 2 * q, denominator: 1}
            });
            expect(equal(data.product, {numerator: a * data.onePart.numerator,
                denominator: data.onePart.denominator})).toBe(true);
            expect(equal(data.reference, {numerator: b * data.onePart.numerator,
                denominator: data.onePart.denominator})).toBe(true);
            expect(data.relation).toBe(profile);

            if (profile === 'greater') {
                expect(a).toBeGreaterThan(b);
                expect(q * a).toBeGreaterThan(q * b);
            } else if (profile === 'less') {
                expect(a).toBeLessThan(b);
                expect(q * a).toBeLessThan(q * b);
            } else {
                expect(a).toBe(b);
                expect(equal(data.product, data.reference)).toBe(true);
            }
        }
        expect(instances.size).toBeGreaterThan(15);
    });

    it('replays exactly and rejects absent or unsupported profiles', () => {
        for (const profile of profiles) {
            expect(sample(profile, `replay-${profile}`)).toEqual(sample(profile, `replay-${profile}`));
        }
        expect(() => generator.generate({} as FractionScalingGeneratorConfig))
            .toThrow(/Required field "comparisonProfile"/);
        expect(() => generator.generate({comparisonProfile: 'unknown'} as unknown as
            FractionScalingGeneratorConfig)).toThrow(/Unsupported comparison profile/);
    });
});
