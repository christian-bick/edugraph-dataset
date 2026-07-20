import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { hasLabel } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length',
    generalLabels: [
        Area.Measurement,
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ]
};


export const MeasureLengthViewSchema = {
    isReverse: [[], hasLabel(Ability.VisualArticulation)]
} as const;

export type MeasureLengthViewConfig = ConfigFromSchema<typeof MeasureLengthViewSchema>;
