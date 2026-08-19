import {Ability} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-patterns',
    generalLabels: []
};

export const ShapePatternsViewSchema = {
    taskMode: [[
        Ability.VisualArticulation,
        Ability.ConceptClassification,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ], selectCanonicalLabel([
        [[Ability.VisualArticulation], 'generate'],
        [[Ability.ConceptClassification], 'identify'],
        [[Ability.ProcedureUnderstanding, Ability.TextualArticulation], 'explain']
    ])]
} as const;

export type ShapePatternsViewConfig = ConfigFromSchema<typeof ShapePatternsViewSchema>;
