import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalWritingGenerator} from './generator.ts';
import {DecimalWritingGeneratorSchema, spec} from './spec.ts';

describe('DecimalWritingGenerator spec', () => {
    it('keeps the exact decimal scope invariant and the notation family selected', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(Object.keys(DecimalWritingGeneratorSchema)).toEqual(['notationFamily']);
    });

    it.each([Area.DecimalNotation, Area.NumberNameNotation])(
        'resolves %s to its selected producer capability', label => {
            setSeed(57);
            const result = generateWithLabels(new DecimalWritingGenerator(), [
                label,
                Scope.ThousandthDecimals,
                Scope.Base10,
                Scope.NumbersWithoutNegatives
            ]);
            expect(result).not.toBeNull();
            expect(result!.labels).toContain(label);
            expect(result!.data.kind).toBe('decimal-writing');
            expect(result!.data.valueInThousandths).toBeGreaterThanOrEqual(0);
        }
    );
});
