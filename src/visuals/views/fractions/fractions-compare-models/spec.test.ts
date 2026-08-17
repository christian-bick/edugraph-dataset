import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('FractionsCompareModelsViewSpec', () => {
    it('owns only the visual-number representation', () => {
        expect(spec.generalLabels).toEqual([Scope.VisualNumbers]);
        expect(spec.generalLabels).not.toContain(Scope.SingleFrameOfReference);
    });
});
