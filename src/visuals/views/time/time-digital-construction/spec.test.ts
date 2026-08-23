import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, TimeDigitalConstructionViewSchema} from './spec.ts';

describe('time-digital-construction view spec', () => {
    it('owns construction of a digital display from a textual time clue', () => {
        expect(spec.generalLabels).toEqual([
            Scope.DigitalClock,
            Scope.ArabicNumerals,
            Ability.Formalization,
            Ability.TextualReception,
            Ability.VisualArticulation
        ]);
        expect(TimeDigitalConstructionViewSchema).toEqual({});
    });
});
