import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    EqualSquarePartitionProblem,
    RectangleAreaProblem,
    UnitSquareGridProblem
} from '../../../types/problems.ts';
import {EqualSquareView} from './shape-equal-square-view.tsx';
import {RectangleAreaView} from './shape-rectangle-area-view.tsx';
import {UnitSquareGridView} from './shape-unit-square-grid-view.tsx';

const payload = <T,>(data: T, viewId: string): RenderPayload<AbstractProblem<T>> => ({
    problem: {type: 'shape', data},
    viewId,
    labels: [],
    isSolutionView: false,
    seed: 1806151483
});

const solutionPayload = <T,>(data: T, viewId: string): RenderPayload<AbstractProblem<T>> => ({
    ...payload(data, viewId),
    isSolutionView: true
});

describe('shape square-array family views', () => {
    it('renders equal-square counting without area semantics', () => {
        const data: EqualSquarePartitionProblem = {
            kind: 'equal-square-partition',
            rows: 3,
            columns: 2,
            partCount: 6
        };
        const markup = renderToStaticMarkup(
            <EqualSquareView
                payload={payload(data, 'shape-equal-square-count')}
                task="count"
                useStory={false}
                viewId="shape-equal-square-count"
            />
        );
        expect(markup).toContain('How many equal squares');
        expect(markup).not.toContain('square unit');
    });

    it('renders floor-area stories without traversal instructions', () => {
        const data: UnitSquareGridProblem = {
            kind: 'unit-square-grid',
            rows: 3,
            columns: 2,
            tileCount: 6,
            unitId: 'square-centimeter'
        };
        const markup = renderToStaticMarkup(
            <UnitSquareGridView
                payload={payload(data, 'shape-square-array-story')}
                task="execution"
                useStory
                viewId="shape-square-array-story"
            />
        );
        expect(markup).toContain('A floor is completely covered');
        expect(markup).not.toContain('start');
        expect(markup).not.toMatch(/[→↓←]/);
    });

    it('retains the counting path for direct unit-square counting', () => {
        const data: UnitSquareGridProblem = {
            kind: 'unit-square-grid',
            rows: 3,
            columns: 2,
            tileCount: 6,
            unitId: 'square-centimeter'
        };
        const markup = renderToStaticMarkup(
            <UnitSquareGridView
                payload={payload(data, 'shape-square-array')}
                task="execution"
                useStory={false}
                viewId="shape-square-array"
            />
        );
        expect(markup).toContain('Follow the arrows');
        expect(markup).toContain('start');
        expect(markup).toMatch(/[→↓←]/);
    });

    it('uses a genuine blank area response instead of instruction text for interpretation', () => {
        const data: UnitSquareGridProblem = {
            kind: 'unit-square-grid',
            rows: 3,
            columns: 2,
            tileCount: 6,
            unitId: 'square-unit'
        };
        const question = renderToStaticMarkup(
            <UnitSquareGridView
                payload={payload(data, 'shape-square-array-interpretation')}
                task="interpretation"
                useStory={false}
                viewId="shape-square-array-interpretation"
            />
        );
        const solution = renderToStaticMarkup(
            <UnitSquareGridView
                payload={solutionPayload(data, 'shape-square-array-interpretation')}
                task="interpretation"
                useStory={false}
                viewId="shape-square-array-interpretation"
            />
        );

        expect(question).toContain('Area:');
        expect(question).toContain('Blank area answer in square units');
        expect(question).not.toContain('Interpret the square-tile evidence as area.');
        expect(solution).toContain('6 unit squares cover the figure');
    });

    it('derives the literal formula from the typed rectangle relation', () => {
        const data: RectangleAreaProblem = {
            kind: 'rectangle-area',
            length: 5,
            width: 4,
            area: 20,
            unitId: 'square-unit'
        };
        const markup = renderToStaticMarkup(
            <RectangleAreaView
                payload={payload(data, 'shape-rectangle-area')}
                task="execution"
                useStory={false}
                viewId="shape-rectangle-area"
            />
        );
        expect(markup).toContain('A = length × width');
        expect(markup).toContain('A = 5 × 4 = ?');
    });
});
