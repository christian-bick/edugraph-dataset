import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-conservation',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.AdditiveCount,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.DirectUnderstanding,
        Scope.ArabicNumerals
    ],
        };
