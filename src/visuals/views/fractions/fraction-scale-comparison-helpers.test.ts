import {describe, expect, it} from 'vitest';
import {buildFractionScaleComparison, buildFractionScaleRelation, fractionScaleNativeDomain,
    fractionScaleProfiles} from '../../../generators/fraction/fraction-scale-domain.ts';
import {formatOriginalScaleFraction, formatScaleRational,
    isValidFractionScaleComparison, isValidFractionScaleRelation} from './fraction-scale-comparison-helpers.ts';

const frame = {q: 4, a: 5, b: 3};
const full = buildFractionScaleComparison(frame, 'greater');
const relation = buildFractionScaleRelation(frame, 'greater');

describe('fraction scale payload boundaries', () => {
    it.each(fractionScaleProfiles)('accepts every exact %s native model in its own nominal family', profile => {
        for (const native of fractionScaleNativeDomain(profile)) {
            const analogy = buildFractionScaleComparison(native, profile), equalParts = buildFractionScaleRelation(native, profile);
            expect(isValidFractionScaleComparison(analogy)).toBe(true);
            expect(isValidFractionScaleRelation(equalParts)).toBe(true);
            expect(isValidFractionScaleComparison(equalParts)).toBe(false);
            expect(isValidFractionScaleRelation(analogy)).toBe(false);
        }
    });

    it('rejects an analogy smuggled into the relation family and missing or inexact full evidence', () => {
        expect(isValidFractionScaleRelation({...relation, wholeNumberAnalogy: full.wholeNumberAnalogy})).toBe(false);
        expect(isValidFractionScaleRelation({...relation, wholeNumberAnalogy: undefined})).toBe(false);
        for (const wholeNumberAnalogy of [undefined, null, [], {factor: 3, product: {numerator: 8, denominator: 1}},
            {factor: 2, product: {numerator: 9, denominator: 1}}, {factor: 2, product: {numerator: 0, denominator: 1}}])
            expect(isValidFractionScaleComparison({...full, wholeNumberAnalogy})).toBe(false);
    });

    it('rejects malformed, unsafe, impossible or inconsistent exact mathematics', () => {
        for (const value of [null, undefined, [], 3, {}, {...relation, kind: 'other'},
            {...relation, reference: {numerator: 0, denominator: 1}},
            {...relation, reference: {numerator: 4, denominator: 2}},
            {...relation, reference: {numerator: 1, denominator: 1}},
            {...relation, reference: {numerator: 6, denominator: 1}},
            {...relation, reference: {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}},
            {...relation, scaleFactor: {numerator: 1, denominator: 1}},
            {...relation, scaleFactor: {numerator: 5, denominator: 7}},
            {...relation, scaleFactor: {numerator: 6, denominator: 3}},
            {...relation, scaleFactor: {numerator: -1, denominator: 3}},
            {...relation, product: {numerator: 19, denominator: 3}},
            {...relation, product: {numerator: 20, denominator: 0}},
            {...relation, onePart: {numerator: 2, denominator: 3}},
            {...relation, relation: 'less'}, {...relation, partDifferenceCount: 1},
            {...relation, partDifferenceCount: NaN}])
            expect(isValidFractionScaleRelation(value)).toBe(false);
    });

    it('checks exact rational equivalence while preserving the original factor notation', () => {
        expect(isValidFractionScaleRelation({...relation, product: {numerator: 40, denominator: 6},
            onePart: {numerator: 8, denominator: 6}})).toBe(true);
        expect(isValidFractionScaleComparison({...full, wholeNumberAnalogy: {factor: 2,
            product: {numerator: 16, denominator: 2}}})).toBe(true);
        expect(formatScaleRational({numerator: 4, denominator: 1})).toBe('4');
        expect(formatScaleRational({numerator: 4, denominator: 3})).toBe('4/3');
        expect(formatOriginalScaleFraction({numerator: 3, denominator: 3})).toBe('3/3');
    });
});
