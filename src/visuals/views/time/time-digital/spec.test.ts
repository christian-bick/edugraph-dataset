import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, TimeDigitalViewSchema} from './spec.ts';

describe('time-digital view spec', () => {
    it('owns digital formalization and resolves both presentation directions', () => {
        expect(spec.generalLabels).toEqual([Scope.DigitalClock, Scope.ArabicNumerals, Ability.Formalization]);
        const resolve = TimeDigitalViewSchema.direction[1];
        expect(resolve([Ability.VisualReception, Ability.Interpretation])).toBe('reading');
        expect(resolve([Ability.TextualReception, Ability.VisualArticulation])).toBe('construction');
        expect(resolve([])).toBeUndefined();
    });
});
