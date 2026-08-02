import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {extractConfig} from '../../../../lib/utils.ts';
import {CountingNumberSequenceViewSchema} from './spec.ts';

describe('CountingNumberSequenceViewSchema', () => {
    it('prefers physical number tiles when both representations are requested', () => {
        const {config} = extractConfig(CountingNumberSequenceViewSchema, [
            Scope.ArabicNumerals,
            Scope.PhysicalNumbers
        ]);

        expect(config.representation).toBe(Scope.PhysicalNumbers);
    });

    it('uses numeral cells for Arabic-numeral targets', () => {
        const {config} = extractConfig(CountingNumberSequenceViewSchema, [Scope.ArabicNumerals]);
        expect(config.representation).toBe(Scope.ArabicNumerals);
    });
});
