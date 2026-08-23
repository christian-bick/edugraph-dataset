import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeClassifyAttributesViewSchema, spec} from './spec.ts';

describe('shape-classify-attributes view spec', () => {
    it('owns visual recognition and concept classification invariantly', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ]);
        expect(ShapeClassifyAttributesViewSchema).toEqual({});
    });
});
