import {Ability, Area} from 'edugraph-ts'; import {describe, expect, it} from 'vitest'; import {spec} from './spec.ts';
describe('shape-partition-unit-fraction view spec', () => {it('owns invariant partition-and-label articulation', () => {
    expect(spec.generalLabels).toEqual([Area.ShapeDecomposition, Area.FractionDenominatorInterpretation, Area.FractionNotation, Ability.VisualArticulation, Ability.Formalization]); expect(spec.rejectedLabels).toBeUndefined();
});});
