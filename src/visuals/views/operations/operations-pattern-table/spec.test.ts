import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {computeTaskFingerprint, resolveViewConfig} from '../../../../lib/generation.ts';
import {OperationsPatternTableViewSchema, spec} from './spec.ts';

describe('operations-pattern-table view spec', () => {
    it('owns invariant table-pattern classification', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptClassification
        ]);
        expect(spec.requiredLabels).toEqual([Area.GenerativeRuleRecognition]);
        expect(OperationsPatternTableViewSchema).toHaveProperty('focusOperand');
        expect(spec.rejectedLabels).toBeUndefined();
    });

    it('makes the selected table row fingerprint-visible', () => {
        const configs = Array.from({length: 24}, (_, seed) =>
            resolveViewConfig(OperationsPatternTableViewSchema, [], seed)
        );
        expect(new Set(configs.map(config => config.focusOperand))).toEqual(new Set([2, 3, 4, 5]));
        expect(new Set(configs.map(config => computeTaskFingerprint(
            {kind: 'operation-table', operation: 'multiplication'},
            config
        ))).size).toBe(4);
    });
});
