import {Ability} from 'edugraph-ts'; import {describe, expect, it} from 'vitest'; import {spec} from './spec.ts';
describe('shape-partition-fraction-interpretation view spec', () => {it('owns invariant fraction-region interpretation', () => {expect(spec.generalLabels).toEqual([Ability.Interpretation]); expect(spec.rejectedLabels).toBeUndefined();});});
