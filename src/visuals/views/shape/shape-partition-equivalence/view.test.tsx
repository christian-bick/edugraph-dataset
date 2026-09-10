import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ShapePartitionEquivalenceGenerator} from '../../../../generators/shape/shape-partition-equivalence/generator.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapePartitionEquivalenceProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';
import {ShapePartitionEquivalenceCore} from './view.tsx';

const generator = new ShapePartitionEquivalenceGenerator();
const render = (data: ShapePartitionEquivalenceProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'shape-partition-equivalence'> = {
        problem: {type: 'shape', data, labels: []},
        viewId: 'shape-partition-equivalence', targetLabels: [], isSolutionView, seed: 42
    };
    return renderToStaticMarkup(<ShapePartitionEquivalenceCore config={{}} payload={payload} />);
};

describe('shape-partition-equivalence view', () => {
    it.each(['circle', 'rectangle'] as const)('asks for possibility and explains the %s witness only in solution mode', shape => {
        const data = generator.generate({shape})!.data;
        const question = render(data, false);
        const solution = render(data, true);
        for (const html of [question, solution]) {
            expect(html).toContain('Can equal shares of identical wholes have different shapes?');
            expect(html).toContain('Explain using these pictures.');
            expect(html.match(/<path /g)).toHaveLength(2);
        }
        expect(question).not.toContain('Yes.');
        expect(question).not.toContain('half-turn');
        expect(solution).toContain('Yes. These pictures show that it is possible.');
        expect(solution).toContain('half-turn fits one piece onto the other');
        expect(question.match(/<svg[\s\S]*?<\/svg>/)?.[0]).toBe(solution.match(/<svg[\s\S]*?<\/svg>/)?.[0]);
        expect(render(data, false)).toBe(question);
    });

    it('renders the supplied partition coordinates rather than a fixed replacement', () => {
        const data = generator.generate({shape: 'rectangle'})!.data;
        data.boundaries[0] = {kind: 'segment', start: {x: -9.5, y: 0}, end: {x: 9.5, y: 0}};
        expect(render(data, false)).toContain('d="M -95 0 L 95 0"');
    });

    it('rejects missing or nonfinite mathematical geometry', () => {
        const data = generator.generate({shape: 'circle'})!.data;
        expect(() => render({...data, boundaries: []} as unknown as ShapePartitionEquivalenceProblem, false)).toThrow(ViewValidationError);
        data.boundaries[0].start.x = NaN;
        expect(() => render(data, false)).toThrow(ViewValidationError);
        expect(() => render({...data, whole: {shape: 'circle', radius: 0}}, false)).toThrow(ViewValidationError);
    });
});
