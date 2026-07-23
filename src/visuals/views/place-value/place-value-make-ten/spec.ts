import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-make-ten',
    // The ten frames render at most 10 dots per side, so any content
    // requiring numbers beyond 10 is out of this view's physical capacity
    rejectedLabels: [
        ...deductCompatible([Scope.NumbersLarger10, Scope.NumbersSmaller1000000])
    ],
    generalLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const PlaceValueMakeTenViewSchema = {} as const;

export type PlaceValueMakeTenViewConfig = ConfigFromSchema<typeof PlaceValueMakeTenViewSchema>;
