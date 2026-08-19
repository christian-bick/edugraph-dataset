import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem-reasoning view spec', () => {
    it('owns result interpretation and procedure understanding for estimation targets', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.ResultInterpretation,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.requiredLabels).toEqual([Area.Estimation, Area.IntegerRounding]);
    });
});
