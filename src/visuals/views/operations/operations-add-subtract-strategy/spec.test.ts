import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsAddSubtractStrategyViewSchema, spec} from './spec.ts';

describe('OperationsAddSubtractStrategyViewSchema', () => {
    it.each([
        [Ability.ProcedureUnderstanding, 'procedure-understanding'],
        [Ability.ConceptDerivation, 'concept-derivation']
    ] as const)('resolves %s to %s', (ability, abilityMode) => {
        expect(extractConfig(OperationsAddSubtractStrategyViewSchema, [ability]).config).toEqual({
            abilityMode
        });
    });

    it('keeps the configurable abilities out of general labels', () => {
        expect(spec.generalLabels).not.toContain(Ability.ProcedureUnderstanding);
        expect(spec.generalLabels).not.toContain(Ability.ConceptDerivation);
    });
});
