import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'counting-conservation',
    generalLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.AdditiveCount,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.DirectUnderstanding,
        Scope.ArabicNumerals
    ],
};


export const CountingConservationViewSchema = {} as const;

export type CountingConservationViewConfig = ConfigFromSchema<typeof CountingConservationViewSchema>;
