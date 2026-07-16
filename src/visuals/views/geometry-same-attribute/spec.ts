import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-same-attribute',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        attribute: { type: 'options', values: ['can-roll', 'can-stack', 'flat-faces'] }
    },
    testParams: {
        attribute: (c) => allOptions(c),
        answer: (key, params) => {
            if (params.attribute === 'can-roll') return 'sphere';
            if (params.attribute === 'can-stack') return 'cube';
            return 'sphere';
        }
    }
};
