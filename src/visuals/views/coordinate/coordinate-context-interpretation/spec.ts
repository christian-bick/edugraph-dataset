import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-context-interpretation',
    generalLabels: [
        Area.OrderedCoordinatePair,
        Scope.CartesianCoordinateSystem,
        Ability.Interpretation,
        Ability.TextualReception
    ]
};

export const CoordinateContextInterpretationViewSchema = {} as const;
export type CoordinateContextInterpretationViewConfig = ConfigFromSchema<typeof CoordinateContextInterpretationViewSchema>;
