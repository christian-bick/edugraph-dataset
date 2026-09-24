import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('tile-scale-request', [Scope.TileScale])
    ]
};

export const ShapeSquareArrayViewSchema = {} as const;

export type ShapeSquareArrayViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayViewSchema
>;
