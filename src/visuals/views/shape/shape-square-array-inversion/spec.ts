import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array-inversion',
    generalLabels: [Ability.ProcedureInversion],
    requiredLabels: [Scope.BoxArrangement]
};
export const ShapeSquareArrayInversionViewSchema = {} as const;
export type ShapeSquareArrayInversionViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayInversionViewSchema
>;
