import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('area-rectilinear-decomposition view spec', () => {
    it('owns the directly observable visual-decomposition ability', () => {
        expect(spec.generalLabels).toContain(Ability.VisualDecomposition);
    });
});
