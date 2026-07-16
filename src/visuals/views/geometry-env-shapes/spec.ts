import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-env-shapes',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        target: { type: 'options', values: ['clock', 'window', 'table'] }
    },
    testParams: {
        target: (c) => allOptions(c),
        answer: (key, params) => {
            if (params.target === 'clock') return 'circle';
            if (params.target === 'window') return 'square';
            return 'rectangle';
        }
    }
};
