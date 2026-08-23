import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, TimeAnalogViewSchema} from './spec.ts';

describe('time-analog view spec', () => {
    it('owns the invariant analog-to-numeral reading task', () => {
        expect(spec.generalLabels).toEqual([
            Scope.AnalogClock,
            Scope.ArabicNumerals,
            Ability.VisualReception,
            Ability.ProcedureExecution,
            Ability.Interpretation,
            Ability.Formalization
        ]);
        expect(TimeAnalogViewSchema).toEqual({});
    });
});
