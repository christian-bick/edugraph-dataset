import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'area-perimeter-comparison',
    generalLabels: []
};

export const AreaPerimeterComparisonViewSchema = {
    taskAbilities: [[
        Ability.ConceptDerivation,
        Ability.ConceptClassification,
        Ability.ProcedureUnderstanding,
        Ability.VisualArticulation
    ], matchAllExactLabels]
} as const;

export type AreaPerimeterComparisonViewConfig = ConfigFromSchema<
    typeof AreaPerimeterComparisonViewSchema
>;
