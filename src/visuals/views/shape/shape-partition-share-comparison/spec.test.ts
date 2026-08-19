import {Ability} from 'edugraph-ts'; import {describe, expect, it} from 'vitest'; import {spec} from './spec.ts';
describe('shape-partition-share-comparison view spec', () => {it('owns invariant share-size derivation', () => {expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]); expect(spec.rejectedLabels).toBeUndefined();});});
