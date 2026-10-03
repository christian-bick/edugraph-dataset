import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';
import {DecimalPlaceValueExpandedGeneratorSchema, spec} from './spec.ts';

describe('DecimalPlaceValueExpandedGenerator spec', () => {
    it('keeps only the reviewed mathematical claims invariant', () => {
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Area.Sum,
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(DecimalPlaceValueExpandedGeneratorSchema).toEqual({});
    });

    it('resolves the Grade 5 decimal expansion target to an exact canonical model', () => {
        const stub = generateWithLabels(new DecimalPlaceValueExpandedGenerator(), [
            Area.PlaceValue,
            Area.Sum,
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ])!;
        expect(stub.labels).toEqual([]);
        expect(stub.data.kind).toBe('decimal-place-value-expanded');
        expect(stub.data.sumTerms.length).toBeGreaterThanOrEqual(2);
        expect(stub.data.sumTerms.reduce((sum, term) => sum + term.contributionInThousandths, 0))
            .toBe(stub.data.valueInThousandths);
    });
});
