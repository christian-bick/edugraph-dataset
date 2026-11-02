import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {buildStandardDivisionProblem} from './generator.ts';
import {standardDivisionHasZero} from './zero-profile.ts';
import {standardDivisionDomain, standardDivisionDomainRow, standardDivisionFrame,
    standardDivisionProfileCount, standardDivisionQuantities, standardDivisionSourceControls} from './domain.ts';

export const divisionProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min))
    .flatMap(profile => ([1, 2, 3] as const).flatMap(width => [false, true].flatMap(zero =>
        standardDivisionProfileCount(width, zero, profile.range) > 0 ? [{...profile, width, zero}] : [])));

describe('compact standard-division canonical domains', () => {
    it('partitions every original pair once, with the original conditional source masses', () => {
        expect(divisionProfiles).toHaveLength(48);
        expect(divisionProfiles.reduce((sum, profile) => sum + standardDivisionProfileCount(profile.width, profile.zero, profile.range), 0))
            .toBe(99890010);
        for (const width of [1, 2, 3] as const) {
            const controls = standardDivisionSourceControls(width);
            expect(controls.pairs).toBe((10 ** width - 10 ** (width - 1)) * 99990);
            expect(controls.originalMixtureMass).toBeCloseTo(1, 9);
            expect(controls.uniformMass).toBeCloseTo(1, 9);
        }
    });

    it('proves both endpoints of every compact row against the independent positional trace', () => {
        let rows = 0;
        for (const profile of divisionProfiles) {
            const domain = standardDivisionDomain(profile.width, profile.zero, profile.range);
            let count = 0, mass = 0;
            for (let index = 0; index < domain.rows.length / 6; index++) {
                const row = standardDivisionDomainRow(domain, index);
                rows++;
                for (const remainder of [row.firstRemainder, row.lastRemainder]) {
                    const data = buildStandardDivisionProblem(row.divisor * row.quotient + remainder, row.divisor);
                    if (standardDivisionHasZero(data) !== profile.zero
                        || !hasCanonicalRangeWitness(standardDivisionQuantities(data), profile.range)) {
                        throw new Error(`Invalid row endpoint: ${JSON.stringify({profile, row, remainder})}`);
                    }
                }
                const length = row.lastRemainder - row.firstRemainder + 1;
                count += length; mass += length * row.pointWeight;
                if (!(row.end > row.end - length * row.pointWeight)) throw new Error('Nonpositive row mass');
            }
            expect(count).toBe(domain.count);
            expect(mass).toBeCloseTo(domain.weight, 12);
        }
        expect(rows).toBeGreaterThan(700000);
    }, 60000);

    it('keeps every small-divisor remainder class correct, including internal zero work', () => {
        // Single-digit divisors have at most nine remainder values. Check every one
        // in each row: the multi-digit proof uses the monotone backwards identity.
        for (const profile of divisionProfiles.filter(profile => profile.width === 1)) {
            const domain = standardDivisionDomain(profile.width, profile.zero, profile.range);
            for (let index = 0; index < domain.rows.length / 6; index++) {
                const row = standardDivisionDomainRow(domain, index);
                for (let r = row.firstRemainder; r <= row.lastRemainder; r++) {
                    const data = buildStandardDivisionProblem(row.divisor * row.quotient + r, row.divisor);
                    if (standardDivisionHasZero(data) !== profile.zero
                        || !hasCanonicalRangeWitness(standardDivisionQuantities(data), profile.range)) throw new Error('Bad small-divisor interval');
                }
            }
        }
    }, 60000);

    it('draws both ends of every cell and retains inclusive inner catalog endpoints', () => {
        for (const profile of divisionProfiles) {
            const domain = standardDivisionDomain(profile.width, profile.zero, profile.range);
            for (const position of [0, domain.weight * (1 - Number.EPSILON)]) {
                const frame = standardDivisionFrame(domain, position);
                const data = buildStandardDivisionProblem(frame.dividend, frame.divisor);
                expect(hasCanonicalRangeWitness(standardDivisionQuantities(data), profile.range)).toBe(true);
                expect(standardDivisionHasZero(data)).toBe(profile.zero);
            }
        }
        const exact = standardDivisionDomain(2, true, createCanonicalNumericRange(100));
        let endpoint = false;
        for (let index = 0; index < exact.rows.length / 6; index++) {
            const row = standardDivisionDomainRow(exact, index);
            if (row.divisor * row.quotient + row.lastRemainder === 100) endpoint = true;
        }
        expect(endpoint).toBe(true);
        expect(standardDivisionProfileCount(1, false, createCanonicalNumericRange(120, 5))).toBe(0);
        expect(standardDivisionDomain(2, true, createCanonicalNumericRange(100, 5)).count).toBe(0);
    });

    it('rejects invalid range and weighted-index contracts', () => {
        expect(() => standardDivisionDomain(4, true, createCanonicalNumericRange(100))).toThrow();
        expect(() => standardDivisionDomain(1, true, {...createCanonicalNumericRange(100), minimumBelow: 10})).toThrow();
        const domain = standardDivisionDomain(1, true, createCanonicalNumericRange(100));
        for (const index of [-1, 0.5, domain.rows.length]) expect(() => standardDivisionDomainRow(domain, index)).toThrow();
        for (const position of [-1, NaN, domain.weight]) expect(() => standardDivisionFrame(domain, position)).toThrow();
    });
});
