import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('NumbersFractionLineViewSchema', () => {
    it('owns invariant visual articulation on one fraction line', () => {
        expect(spec.generalLabels).toEqual([
            Scope.Numberline,
            Scope.SingleFrameOfReference,
            Ability.VisualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
