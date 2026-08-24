import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {computeTaskFingerprint, resolveViewConfig} from '../../../../lib/generation.ts';
import {OperationsPatternGenerationPracticeViewSchema, spec} from './spec.ts';

describe('operations-pattern-generation-practice view spec', () => {
    it('owns invariant pattern procedure execution', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]);
        expect(spec.requiredLabels).toEqual([Area.PatternGeneration]);
        expect(OperationsPatternGenerationPracticeViewSchema).toHaveProperty('missingTermIndex');
        expect(spec.rejectedLabels).toBeUndefined();
    });

    it('makes the missing recurrence term fingerprint-visible', () => {
        const configs = Array.from({length: 24}, (_, seed) =>
            resolveViewConfig(OperationsPatternGenerationPracticeViewSchema, [], seed)
        );
        expect(new Set(configs.map(config => config.missingTermIndex))).toEqual(new Set([2, 3, 4]));
        expect(new Set(configs.map(config => computeTaskFingerprint(
            {kind: 'recurrence', terms: [1, 2, 3, 4, 5]},
            config
        ))).size).toBe(3);
    });
});
