import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ShapePartitionView} from './shape-partition-view.tsx';
import {ShapePartitionModel, ShapePartitionTask} from './shape-partition-helpers.ts';

const render = (data: ShapePartitionModel, task: ShapePartitionTask, isSolutionView: boolean) =>
    renderToStaticMarkup(createElement(ShapePartitionView, {viewId: 'partition-test', task,
        payload: {viewId: 'partition-test', problem: {type: 'shape', data, labels: []}, targetLabels: [], seed: 17, isSolutionView}}));

describe('Equal-partition projections', () => {
    it('renders every supported partition in each task and mode', () => {
        for (const shape of ['circle', 'rectangle'] as const) {
            for (const parts of [2, 3, 4, 6, 8] as const) {
                const data = {kind: 'partition', shape, parts} as const;
                for (const task of ['partition', 'name-share', 'compose-whole', 'partition-and-label-unit-fraction'] as const) {
                    const question = render(data, task, false), solution = render(data, task, true);
                    expect(question).not.toContain('undefined');
                    expect(solution).not.toContain('undefined');
                    expect(question).not.toBe(solution);
                    expect(render(data, task, false)).toBe(question);
                }
                const question = render(data, 'partition', false);
                expect(question).not.toContain('<line');
                expect(render(data, 'partition', true)).toContain('<line');
            }
        }
    });
    it.each([[2, 'one half', 'two halves'], [3, 'one third', 'three thirds'],
        [4, 'one fourth (one quarter)', 'four fourths (four quarters)'],
        [6, 'one sixth', 'six sixths'], [8, 'one eighth', 'eight eighths']] as const)
    ('names each share and its whole partition for %i parts', (parts, singular, plural) => {
        const data = {kind: 'partition', shape: 'circle', parts} as const;
        expect(render(data, 'name-share', false)).not.toContain(singular);
        const solution = render(data, 'name-share', true);
        expect(solution).toContain(singular);
        expect(solution).toContain(plural);
        expect(solution).toContain('of the whole');
    });
    it('keeps six and eight separate pieces within a two-row composition layout', () => {
        for (const parts of [6, 8] as const) {
            const data = {kind: 'partition', shape: 'circle', parts} as const;
            const question = render(data, 'compose-whole', false);
            expect(question).toContain('grid-cols-4');
            expect(question.match(/<svg /g)).toHaveLength(parts);
            expect(question).not.toContain('Answer: one whole');
            expect(render(data, 'compose-whole', true)).toContain('Answer: one whole');
        }
    });
});

describe('Selected-region and comparison projections', () => {
    it('withholds each proper fraction and reveals its exact numerator and denominator', () => {
        for (const shape of ['circle', 'rectangle'] as const) {
            for (const parts of [2, 3, 4, 6, 8] as const) {
                for (let numerator = 1; numerator < parts; numerator++) {
                    const data = {kind: 'selected-region', shape, parts, numerator} as const;
                    expect(render(data, 'interpret-fraction', false)).not.toContain('Answer:');
                    expect(render(data, 'interpret-fraction', true)).toContain(`Answer: ${numerator}/${parts}`);
                }
            }
        }
    });
    it.each(['circle', 'rectangle'] as const)('keeps both %s wholes and marks the fourth as smaller only in the solution', shape => {
        const data = {kind: 'share-comparison', shape, leftParts: 4, rightParts: 2, relation: 'less'} as const;
        const question = render(data, 'compare-share-size', false);
        expect(question).toContain('fourth');
        expect(question).toContain('half');
        expect(question).not.toContain('border-emerald-600');
        expect(render(data, 'compare-share-size', true)).toContain('border-emerald-600');
    });
    it('rejects a payload that does not satisfy the requested projection', () => {
        expect(() => render({kind: 'partition', shape: 'circle', parts: 4}, 'interpret-fraction', false)).toThrow();
        expect(() => render({kind: 'selected-region', shape: 'circle', parts: 4, numerator: 4}, 'interpret-fraction', false)).toThrow();
    });
});
