import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-decompose',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ],
        testParams: {
        pair1: (key, params) => {
            const half = Math.floor(params.targetNumber / 2);
            return [half, params.targetNumber - half];
        },
        pair2: (key, params) => {
            return [1, params.targetNumber - 1];
        }
    }
};
