import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph',
    generalLabels: [Scope.PictureGraph],
    rejectedLabels: [Scope.SingleStep, Scope.MultiStep]
};

export const DataPictureGraphViewSchema = {
    showConstructionTask: [[Ability.VisualArticulation], hasLabel(Ability.VisualArticulation)],
    showArithmeticTask: [[Ability.ProcedureExecution], hasLabel(Ability.ProcedureExecution)]
} as const;
export type DataPictureGraphViewConfig = ConfigFromSchema<typeof DataPictureGraphViewSchema>;
