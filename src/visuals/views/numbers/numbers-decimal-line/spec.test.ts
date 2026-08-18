import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-decimal-line view spec', () => {
    it('owns the single-frame decimal number-line articulation', () => {
        expect(spec.generalLabels).toEqual([
            Area.NumerationWithDecimals,
            Scope.Numberline,
            Scope.SingleFrameOfReference,
            Ability.VisualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
