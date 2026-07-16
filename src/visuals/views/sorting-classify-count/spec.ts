import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-count',
    supportedLabels: [
        Area.ObjectSorting,
        Area.CollectionSense,
        Area.Numeration,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ConceptClassification
    ],
    constraints: {
        classifyType: { type: 'options', values: ['shape', 'color'] },
        numObjects: { type: 'range', min: 4, max: 15 }
    },
    testParams: {
        classifyType: (c) => allOptions(c),
        numObjects: (c) => limitsAndMean(c),
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
        }
    }
};
