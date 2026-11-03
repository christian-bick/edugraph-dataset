import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {fractionScaleDomain, fractionScaleProfiles, fractionScaleUpperBounds} from '../fraction-scale-domain.ts';
import {FractionScaleRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new FractionScaleRelationsGenerator();

describe('analogy-free fraction scale relations', () => {
    it.each(fractionScaleProfiles)('constructs every %s native outcome within its selected band', comparisonProfile => {
        for (const upper of fractionScaleUpperBounds(comparisonProfile)) {
            const range = createCanonicalNumericRange(upper), rows = fractionScaleDomain('comparison', comparisonProfile, range);
            const mock = vi.spyOn(rng, 'random');
            for (const frame of rows) {
                const qRows = rows.filter(row => row.q === frame.q), qbRows = qRows.filter(row => row.b === frame.b);
                const mass = (items: typeof rows) => items.reduce((sum, row) => sum + row.weight, 0);
                mock.mockReturnValueOnce((mass(rows.filter(row => row.q < frame.q)) + mass(qRows) / 2) / mass(rows));
                mock.mockReturnValueOnce((mass(qRows.filter(row => row.b < frame.b)) + mass(qbRows) / 2) / mass(qRows));
                if (comparisonProfile !== 'equal')
                    mock.mockReturnValueOnce((mass(qbRows.filter(row => row.a < frame.a)) + frame.weight / 2) / mass(qbRows));
                const before = mock.mock.calls.length;
                expect(generator.generate({comparisonProfile, range})).toEqual({data: {kind: 'fraction-scale-relation',
                    reference: {numerator: frame.q, denominator: 1}, scaleFactor: {numerator: frame.a, denominator: frame.b},
                    product: {numerator: frame.q * frame.a, denominator: frame.b}, relation: comparisonProfile,
                    onePart: {numerator: frame.q, denominator: frame.b}, partDifferenceCount: frame.a - frame.b}});
                expect(mock.mock.calls.length - before).toBe(comparisonProfile === 'equal' ? 2 : 3);
            }
            mock.mockRestore();
        }
    });

    it.each(fractionScaleProfiles)('replays the %s relation with its original continuation length', comparisonProfile => {
        for (const upper of fractionScaleUpperBounds(comparisonProfile)) {
            rng.setSeed(27);
            for (let index = 0; index < (comparisonProfile === 'equal' ? 2 : 3); index++) rng.random();
            const continuation = rng.getRandomState();
            const config = {comparisonProfile, range: createCanonicalNumericRange(upper)};
            rng.setSeed(27); const first = generator.generate(config);
            expect(rng.getRandomState()).toBe(continuation);
            rng.setSeed(27); expect(generator.generate(config)).toEqual(first);
        }
    });

    it('rejects absent, unsupported and infeasible constraints', () => {
        expect(() => generator.generate({} as never)).toThrow(/Required field "comparisonProfile"/);
        expect(() => generator.generate({comparisonProfile: 'equal'})).toThrow(/Required field "range"/);
        expect(() => generator.generate({comparisonProfile: 'unknown', range: createCanonicalNumericRange(5)} as never)).toThrow(/Unsupported comparison profile/);
        expect(() => generator.generate({comparisonProfile: 'less', range: createCanonicalNumericRange(20)})).toThrow();
    });
});
