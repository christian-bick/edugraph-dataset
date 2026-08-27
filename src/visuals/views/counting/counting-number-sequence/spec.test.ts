import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {extractConfig} from '../../../../lib/utils.ts';
import {CountingNumberSequenceViewSchema} from './spec.ts';

describe('CountingNumberSequenceViewSchema', () => {
    it('resolves the explicit physical-plus-numeral bundle to physical tiles', () => {
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
