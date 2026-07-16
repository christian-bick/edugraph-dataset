import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

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
    constraints: {
        numObjects: { type: 'range', min: 1, max: 15 }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c)
    }
};
