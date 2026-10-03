import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalRoundingGenerator} from './generator.ts';
import {DecimalRoundingGeneratorSchema, spec} from './spec.ts';

describe('DecimalRoundingGenerator spec', () => {
    it('owns only the invariant decimal rounding mathematics and numeric context', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalRounding,
            Scope.DecimalNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(DecimalRoundingGeneratorSchema).toEqual({});
    });

    it('resolves the Grade 5 rounding target to the canonical exact model', () => {
        const stub = generateWithLabels(new DecimalRoundingGenerator(), [
            Area.DecimalRounding,
            Scope.DecimalNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ])!;
        expect(stub.labels).toEqual([]);
        expect(stub.data.kind).toBe('decimal-place-rounding');
        expect(stub.data.roundedInTenThousandths)
            .toBe(stub.data.direction === 'down'
                ? stub.data.lowerCandidateInTenThousandths : stub.data.upperCandidateInTenThousandths);
    });
});
