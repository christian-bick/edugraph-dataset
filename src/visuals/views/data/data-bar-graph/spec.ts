import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph',
    generalLabels: [Scope.BarGraph]
};

export const DataBarGraphViewSchema = {
    showConstructionTask: [[Ability.VisualArticulation], hasLabel(Ability.VisualArticulation)],
    showArithmeticTask: [[Ability.ProcedureExecution], hasLabel(Ability.ProcedureExecution)],
    interpretCategory: [[Ability.Interpretation], hasLabel(Ability.Interpretation)],
    classifyData: [[Ability.ConceptClassification], hasLabel(Ability.ConceptClassification)]
} as const;

export type DataBarGraphViewConfig = ConfigFromSchema<typeof DataBarGraphViewSchema>;
