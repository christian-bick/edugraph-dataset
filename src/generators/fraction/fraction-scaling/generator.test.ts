import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {getRandomState, random} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {FractionScaleComparisonProblem, FractionScaleRational} from '../../../types/problems.ts';
import {FractionScalingGenerator} from './generator.ts';
import type {FractionScalingGeneratorConfig} from './spec.ts';
import {fractionScaleDomain, fractionScaleUpperBounds} from '../fraction-scale-domain.ts';

afterEach(() => vi.restoreAllMocks());

const generator = new FractionScalingGenerator();
const profiles = ['greater', 'less', 'equal'] as const;
type Profile = typeof profiles[number];

const sample = (comparisonProfile: Profile, seed: string, upper: number): FractionScaleComparisonProblem => {
    setSeed(seed);
    return generator.generate({comparisonProfile, range: createCanonicalNumericRange(upper)}).data;
};

const equal = (left: FractionScaleRational, right: FractionScaleRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
        === BigInt(right.numerator) * BigInt(left.denominator);

describe('fraction-scaling exact comparison model', () => {
    it.each(profiles)('constructs the %s relation and all exact witnesses', profile => {
        const instances = new Set<string>();
        const uppers = fractionScaleUpperBounds(profile);
        for (let seed = 0; seed < 160; seed++) {
            const data = sample(profile, `${profile}-${seed}`, uppers[seed % uppers.length]!);
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
            expect(sample(profile, `replay-${profile}`, 5)).toEqual(sample(profile, `replay-${profile}`, 5));
        }
        expect(() => generator.generate({} as FractionScalingGeneratorConfig))
            .toThrow(/Required field "comparisonProfile"/);
        expect(() => generator.generate({comparisonProfile: 'unknown', range: createCanonicalNumericRange(5)} as unknown as
            FractionScalingGeneratorConfig)).toThrow(/Unsupported comparison profile/);
        expect(() => generator.generate({comparisonProfile: 'less'})).toThrow(/Required field "range"/);
        expect(() => generator.generate({comparisonProfile: 'less', range: createCanonicalNumericRange(20)})).toThrow();
    });

    it.each(profiles)('preserves the %s draw count and continuation in every configured band', comparisonProfile => {
        for (const upper of comparisonProfile === 'greater' ? [5, 10, 20] : [5, 10]) {
            setSeed('scaling-continuation');
            for (let i = 0; i < (comparisonProfile === 'equal' ? 2 : 3); i++) random();
            const expectedState = getRandomState();
            setSeed('scaling-continuation');
            const result = generator.generate({comparisonProfile, range: createCanonicalNumericRange(upper)});
            expect(Object.keys(result)).toEqual(['data']);
            expect(getRandomState()).toBe(expectedState);
            expect(Math.max(result.data.reference.numerator, result.data.scaleFactor.numerator,
                result.data.scaleFactor.denominator, 2 * result.data.reference.numerator)).toBeLessThanOrEqual(upper);
        }
    });

    it.each(profiles)('retains every %s native analogy-bearing outcome across canonical cells', comparisonProfile => {
        for (const upper of fractionScaleUpperBounds(comparisonProfile)) {
            const range = createCanonicalNumericRange(upper), rows = fractionScaleDomain('analogy', comparisonProfile, range);
            const draw = vi.spyOn(rng, 'random');
            const mass = (items: typeof rows) => items.reduce((sum, row) => sum + row.weight, 0);
            for (const frame of rows) {
                const qRows = rows.filter(row => row.q === frame.q), qbRows = qRows.filter(row => row.b === frame.b);
                draw.mockReturnValueOnce((mass(rows.filter(row => row.q < frame.q)) + mass(qRows) / 2) / mass(rows));
                draw.mockReturnValueOnce((mass(qRows.filter(row => row.b < frame.b)) + mass(qbRows) / 2) / mass(qRows));
                if (comparisonProfile !== 'equal')
                    draw.mockReturnValueOnce((mass(qbRows.filter(row => row.a < frame.a)) + frame.weight / 2) / mass(qbRows));
                expect(generator.generate({comparisonProfile, range})).toEqual({data: {
                    kind: 'fraction-scale-comparison', reference: {numerator: frame.q, denominator: 1},
                    scaleFactor: {numerator: frame.a, denominator: frame.b}, product: {numerator: frame.q * frame.a, denominator: frame.b},
                    relation: comparisonProfile, onePart: {numerator: frame.q, denominator: frame.b}, partDifferenceCount: frame.a - frame.b,
                    wholeNumberAnalogy: {factor: 2, product: {numerator: 2 * frame.q, denominator: 1}}}});
            }
            draw.mockRestore();
        }
    });
});
