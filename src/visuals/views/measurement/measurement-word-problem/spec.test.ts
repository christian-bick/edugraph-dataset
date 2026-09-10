import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {MeasurementWordProblemViewSchema} from './spec.ts';

describe('measurement-word-problem unit configuration', () => {
    it.each([
        [[Scope.GramScale], 'gram', [Scope.GramScale]],
        [[Scope.KilogramScale], 'kilogram', [Scope.KilogramScale]],
        [[Scope.LiterScale], 'liter', [Scope.LiquidVolumes, Scope.LiterScale]],
        [[Scope.LiquidVolumes], 'liter', [Scope.LiquidVolumes, Scope.LiterScale]]
    ] as const)('resolves %s to one coherent unit profile', (labels, scale, capabilities) => {
        const resolved = extractConfig(MeasurementWordProblemViewSchema, [...labels]);
        expect(resolved.config).toEqual({scale});
        expect(new Set(resolved.resolvedLabels)).toEqual(new Set(capabilities));
    });

    it.each([
        [Scope.GramScale, Scope.LiterScale],
        [Scope.KilogramScale, Scope.LiquidVolumes]
    ])('rejects incompatible unit contexts %s', (...labels) => {
        expect(() => extractConfig(MeasurementWordProblemViewSchema, labels)).toThrow();
    });
});
