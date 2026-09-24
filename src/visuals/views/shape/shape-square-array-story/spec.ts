import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array-story',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('tile-scale-request', [Scope.TileScale])
    ]
};
export const ShapeSquareArrayStoryViewSchema = {} as const;
export type ShapeSquareArrayStoryViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayStoryViewSchema
>;
