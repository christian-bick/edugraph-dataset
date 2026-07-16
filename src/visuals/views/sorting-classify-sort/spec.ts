import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    supportedLabels: [
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        classifyType: { type: 'options', values: ['shape', 'color'] },
        relation: { type: 'options', values: ['most', 'least'] },
    },
    testParams: {
        classifyType: (c) => allOptions(c),
        relation: (c) => allOptions(c),
        items: (key, params) => {
            const items = [];
            const shapes = ['circle', 'square', 'triangle'];
            const colors = ['red', 'blue', 'green'];
            for (let i = 0; i < params.numObjects; i++) {
                items.push({
                    shape: shapes[i % shapes.length],
                    color: colors[Math.floor(i / shapes.length) % colors.length]
                });
            }
            return items;
        },
        categories: (key, params) => {
            const counts: Record<string, number> = {};
            for (const item of params.items) {
                const val = params.classifyType === 'shape' ? item.shape : item.color;
                counts[val] = (counts[val] || 0) + 1;
            }
            return counts;
        },
        answer: (key, params) => {
            const entries = Object.entries(params.categories);
            entries.sort((a, b) => params.relation === 'most' ? b[1] - a[1] : a[1] - b[1]);
            return entries[0]?.[0] || '';
        }
    }
};
