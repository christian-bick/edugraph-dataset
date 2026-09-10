import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-unit-fraction',
    generalLabels: [Area.ShapeDecomposition, Area.FractionDenominatorInterpretation, Area.FractionNotation, Ability.VisualArticulation, Ability.Formalization]
};

export const ShapePartitionUnitFractionViewSchema = {} as const;
export type ShapePartitionUnitFractionViewConfig = ConfigFromSchema<typeof ShapePartitionUnitFractionViewSchema>;
