import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {ParityGroupingProblem} from '../../../../types/problems.ts';
import {CountingObjectsParityCore} from './view.tsx';

const grouping = (count: number): ParityGroupingProblem => ({kind: 'parity-grouping', numObjects: count,
    groupSize: Math.floor(count / 2), remainder: count % 2 as 0 | 1,
    parity: count % 2 === 0 ? 'even' : 'odd'});
const render = (data: ParityGroupingProblem, solution: boolean, seed = 17) => {
    const payload: ViewRenderPayload<'counting-objects-parity'> = {viewId: 'counting-objects-parity',
        problem: {type: 'counting', data, labels: []}, targetLabels: [], seed, isSolutionView: solution};
    return renderToStaticMarkup(<CountingObjectsParityCore config={{}} payload={payload} />);
};

describe('canonical parity grouping projection', () => {
    it('preserves both group witnesses and withholds the classification in question mode', () => {
        for (let count = 1; count <= 20; count++) {
            const data = grouping(count);
            const question = render(data, false), solution = render(data, true);
            for (const markup of [question, solution]) {
                expect(markup).toContain(`Can ${count} objects be split into two equal groups?`);
                expect(markup).toContain(`aria-label="group 1 with ${data.groupSize} objects"`);
                expect(markup).toContain(`aria-label="group 2 with ${data.groupSize} objects"`);
                expect(markup.match(/class="size-10 rounded-full/g)).toHaveLength(count);
            }
            expect(question).toContain('Classify the collection');
            expect(solution).toContain(`2 groups of ${data.groupSize}, ${data.remainder ? '1 left over' : 'none left over'}`);
            expect(solution).toContain(`>${data.parity}</div>`);
            expect(question).not.toContain(`>${data.parity}</div>`);
        }
    });

    it.each([
        {kind: undefined}, {kind: 'counting'}, {numObjects: 0}, {numObjects: 21}, {numObjects: 1.5},
        {parity: undefined}, {parity: 'prime'}, {parity: 'even'},
        {groupSize: undefined}, {groupSize: -1}, {groupSize: 0.5}, {groupSize: 9},
        {remainder: undefined}, {remainder: 2}, {remainder: 0}
    ])('rejects missing or inconsistent canonical grouping evidence: %j', invalid => {
        const data = {...grouping(3), ...invalid} as ParityGroupingProblem;
        expect(() => render(data, false)).toThrow();
        expect(() => render(data, true)).toThrow();
    });

    it('uses the render seed only for presentation', () => {
        const data = grouping(3);
        expect(render(data, false, 17)).toEqual(render(data, false, 17));
        expect(render(data, false, 17)).not.toEqual(render(data, false, 18));
    });
});
