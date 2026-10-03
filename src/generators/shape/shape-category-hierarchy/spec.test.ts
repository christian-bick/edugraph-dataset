import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeCategoryHierarchyGenerator} from './generator.ts';
import {ShapeCategoryHierarchyGeneratorSchema, spec} from './spec.ts';

const generalLabels = [Area.ShapeSubsumption, Scope.ShapeAttributes, Scope.TwoDimensional];

describe('shape-category-hierarchy schema integration', () => {
    it('keeps subsumption and plane attributes invariant with no Ability claim', () => {
        expect(spec.generalLabels).toEqual(generalLabels);
        expect(spec.generalLabels).not.toContain(Area.ShapeClassification);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it('resolves inheritance without an extra classification claim', () => {
        const labels = [...generalLabels, Ability.ConceptDerivation];
        const resolution = extractConfig(ShapeCategoryHierarchyGeneratorSchema, labels);
        expect(resolution.config.classificationModel).toBe('inheritance');
        expect(resolution.resolvedLabels).toEqual([]);
        const result = generateWithLabels(new ShapeCategoryHierarchyGenerator(), labels)!;
        expect(result.data.classificationCases).toBeUndefined();
        expect(result.labels).toEqual([]);
    });

    it('resolves classification to four geometrically classified cases', () => {
        const labels = [...generalLabels, Area.ShapeClassification,
            Ability.ConceptClassification, Ability.VisualArticulation];
        const resolution = extractConfig(ShapeCategoryHierarchyGeneratorSchema, labels);
        expect(resolution.config.classificationModel).toBe('classification');
        expect(resolution.resolvedLabels).toEqual([Area.ShapeClassification]);
        const result = generateWithLabels(new ShapeCategoryHierarchyGenerator(), labels)!;
        expect(result.data.classificationCases).toHaveLength(4);
        expect(result.labels).toEqual([Area.ShapeClassification]);
    });
});
