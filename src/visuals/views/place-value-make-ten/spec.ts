import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'place-value-make-ten',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
    constraints: {
        givenNumber: { type: 'range', min: 1, max: 9 },
        mode: { type: 'options', values: ['make-ten'] }
    },
    testParams: {
        givenNumber: (c) => limitsAndMean(c),
        mode: (c) => 'make-ten',
        missingNumber: (key, params) => 10 - params.givenNumber
    }
};
