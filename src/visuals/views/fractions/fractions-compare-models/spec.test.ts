import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('FractionsCompareModelsViewSpec', () => {
    it('owns invariant common-component inference', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Ability.LogicalInference
        ]);
        expect(spec.generalLabels).not.toContain(Scope.SingleFrameOfReference);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
