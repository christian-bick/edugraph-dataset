import {Ability, Area} from 'edugraph-ts'; import {describe, expect, it} from 'vitest'; import {spec} from './spec.ts';
describe('shape-partition-whole-composition view spec', () => {it('owns invariant whole composition', () => {expect(spec.generalLabels).toEqual([Area.ShapeSynthesis, Ability.ConceptComposition]); expect(spec.rejectedLabels).toBeUndefined();});});
