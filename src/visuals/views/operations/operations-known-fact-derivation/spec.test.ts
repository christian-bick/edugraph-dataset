import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsKnownFactDerivationViewSchema, spec} from './spec.ts';

describe('OperationsKnownFactDerivationViewSpec', () => {
    it('owns no invariant label beyond its configured task Abilities', () => {
        expect(spec.generalLabels).toEqual([]);
    });

    it.each([
        [[Ability.ProcedureUnderstanding]],
        [[Ability.ProcedureUnderstanding, Ability.ProcedureInversion]]
    ])('resolves the exact task Ability set %j', taskAbilities => {
        expect(extractConfig(
            OperationsKnownFactDerivationViewSchema,
            taskAbilities
        ).config.taskAbilities).toEqual(taskAbilities);
    });
});
