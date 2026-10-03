import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const classificationModels = [
    [[], 'inheritance'],
    [[Area.ShapeClassification], 'classification']
] as const;

const resolveClassificationModel = selectExactLabelSetMap(classificationModels);

export const spec: GeneratorSpec = {
    generatorId: 'shape-category-hierarchy',
    generalLabels: [Area.ShapeSubsumption, Scope.ShapeAttributes, Scope.TwoDimensional]
};

export const ShapeCategoryHierarchyGeneratorSchema = {
    classificationModel: [[Area.ShapeClassification],
        resolveClassificationModel, classificationModels.map(([labels]) => labels)]
} as const;

export type ShapeCategoryHierarchyGeneratorConfig = ConfigFromSchema<
    typeof ShapeCategoryHierarchyGeneratorSchema
>;
