import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-make-ten',
    // The ten frames render at most 10 dots per side, so any content
    // requiring numbers beyond 10 is out of this view's physical capacity
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger10])
    ],
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const PlaceValueMakeTenViewSchema = {} as const;

export type PlaceValueMakeTenViewConfig = ConfigFromSchema<typeof PlaceValueMakeTenViewSchema>;
