import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('place-value arithmetic model spec', () => {
    it('rejects sub-ten grouping targets outside the arithmetic presentation boundary', () => {
        expect(spec.rejectedLabels).toContain(Scope.NumbersSmaller10);
    });
});
