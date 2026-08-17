import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-operation-model view spec', () => {
    it('owns only its invariant visual-number representation', () => {
        expect(spec.generalLabels).toEqual([Scope.VisualNumbers]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
