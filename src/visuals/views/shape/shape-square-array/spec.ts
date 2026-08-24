import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array',
    generalLabels: [Ability.ProcedureExecution],
    requiredLabels: [Scope.TileScale]
};

export const ShapeSquareArrayViewSchema = {} as const;

export type ShapeSquareArrayViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayViewSchema
>;
