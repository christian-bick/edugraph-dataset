import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-interpretation-model view spec', () => {
    it('owns its invariant fraction interpretation', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Ability.Interpretation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
