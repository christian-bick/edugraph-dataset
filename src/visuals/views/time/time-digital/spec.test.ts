import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, TimeDigitalViewSchema} from './spec.ts';

describe('time-digital view spec', () => {
    it('owns the invariant digital reading task', () => {
        expect(spec.generalLabels).toEqual([
            Scope.DigitalClock,
            Scope.ArabicNumerals,
            Ability.Formalization,
            Ability.VisualReception,
            Ability.Interpretation
        ]);
        expect(TimeDigitalViewSchema).toEqual({});
    });
});
