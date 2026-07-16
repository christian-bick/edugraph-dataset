import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Scope.LengthMeasurement,
        Scope.HeightMeasurement,
        Scope.WeightMeasurement
    ],
    constraints: {
        attribute: { type: 'options', values: ['length', 'height', 'weight'] }
    },
    testParams: {
        attribute: (c) => allOptions(c),
        relation: (key, params) => params.attribute === 'length' ? 'longer' : (params.attribute === 'height' ? 'taller' : 'heavier'),
        val1: 8,
        val2: 4,
        answer: 'A'
    }
};
