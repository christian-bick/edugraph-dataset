import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {ShapeSquareArrayProblem} from '../../../types/problems.ts';
import {ShapeSquareArrayView} from './shape-square-array-view.tsx';

const data: ShapeSquareArrayProblem = {
    model: 'unit-square-coverage',
    rows: 3,
    columns: 2,
    squareCount: 6,
    areaUnit: 'square centimeters'
};

const payload = (viewId: string): RenderPayload<AbstractProblem<ShapeSquareArrayProblem>> => ({
    problem: {type: 'shape', data},
    viewId,
    labels: [],
    isSolutionView: false,
    seed: 1806151483
});

describe('shape-square-array shared view', () => {
    it('renders floor-area stories as tiles without traversal instructions', () => {
        const markup = renderToStaticMarkup(
            <ShapeSquareArrayView
                mode="execution"
                payload={payload('shape-square-array-story')}
                useStory
                viewId="shape-square-array-story"
            />
        );

        expect(markup).toContain('A floor is completely covered');
        expect(markup).not.toContain('start');
        expect(markup).not.toMatch(/[→↓←]/);
    });

    it('retains the counting path for the direct tile-counting task', () => {
        const markup = renderToStaticMarkup(
            <ShapeSquareArrayView
                mode="execution"
                payload={payload('shape-square-array')}
                useStory={false}
                viewId="shape-square-array"
            />
        );

        expect(markup).toContain('Follow the arrows');
        expect(markup).toContain('start');
        expect(markup).toMatch(/[→↓←]/);
    });
});
