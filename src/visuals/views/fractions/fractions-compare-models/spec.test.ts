import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {FractionsCompareModelsViewSchema, spec} from './spec.ts';

describe('FractionsCompareModelsViewSpec', () => {
    it('owns only the visual-number representation', () => {
        expect(spec.generalLabels).toEqual([Scope.VisualNumbers]);
        expect(spec.generalLabels).not.toContain(Scope.SingleFrameOfReference);
    });

    it.each([
        Ability.LogicalInference,
        Ability.ProcedureUnderstanding
    ])('resolves %s as a view-owned comparison mode', ability => {
        expect(extractConfig(FractionsCompareModelsViewSchema, [ability]).config.abilityMode)
            .toBe(ability);
    });
});
