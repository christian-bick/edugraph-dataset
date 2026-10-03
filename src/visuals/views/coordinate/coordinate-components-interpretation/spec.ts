import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-components-interpretation',
    generalLabels: [
        Area.OrderedCoordinatePair,
        Scope.CartesianCoordinateSystem,
        Scope.TwoDimensional,
        Ability.Interpretation
    ]
};

export const CoordinateComponentsInterpretationViewSchema = {} as const;
export type CoordinateComponentsInterpretationViewConfig = ConfigFromSchema<
    typeof CoordinateComponentsInterpretationViewSchema
>;
