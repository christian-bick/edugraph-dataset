import {createHash} from 'node:crypto';
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
    problem: {type: 'shape', data, labels: []},
    viewId,
    targetLabels: [],
    isSolutionView: false,
    seed: 1806151483
});

const solutionPayload = <T,>(data: T, viewId: string): RenderPayload<AbstractProblem<T>> => ({
    ...payload(data, viewId),
    isSolutionView: true
});

describe('shape square-array family views', () => {
    // Captured before the counting-path repair for every legal multi-tile dimension pair.
    it.each([
        [2, 2, '0da924725297b450cb478cc4893c0670e7ab7fc399985059a787831c8bb1afad'],
        [2, 3, '08e6726c2613b6e83d8cb341e9db4cece4af40a0614c616a8a0de46cfab19f6d'],
        [2, 4, '354fed5576b452cf459759c00e1f91d740b60857ae2194a128820403a01a9124'],
        [2, 5, '3f939b1644f2176fae694a4d72d744e16795b145f61c95d33515e7c836a17d56'],
        [3, 2, 'b9ea6ad5fb82611572edd5ebbbc96f44d278589cca632a5fc2b01be5c56bd4d5'],
        [3, 3, '3c6db52a9fbcebeafb60a3e6b6c277fd611c9ed7e3a1b7a8e0a3f63736dc0f1b'],
        [3, 4, 'dc5cb7d3673ff3e597a6d608985217d7f56e1590765127dc4807e9510960fca1'],
        [3, 5, 'a5929ca3001a05866a28c43989da9328dab676096ca09458f00837af26108cbc'],
        [4, 2, '6807f32abeedf0b6a554570b3416af0bc1ec2bf3aaeed96f1742ce5c9346cd6f'],
        [4, 3, '5e1114604297e1c49fe39848152f115ebffc135e842c3074b83c7b9db905b0ad'],
        [4, 4, '449cca6c1c30ec5ae13f4493307d82e268abfdd324e0788c26e03cd602f12d88'],
        [4, 5, 'ab4b2657d3ce5341c0dac642c73514d92b96539eab6fc0b0917cf1c4b276f6fc'],
        [5, 2, 'c6fb46ed05e10360f8ac0cbc9863926c7daec48f6fa626008dfd0c70ae19c9a0'],
        [5, 3, 'a17163b5adea6ae108b7cdf3255f5cd1d2231140469804f9ec3f0ecbf1f85cee'],
        [5, 4, '204000a48269d2c8e65801e28223aacd3b1cbfbe0bbfa411001c4cb82f457362'],
        [5, 5, 'a0752388ee293a01a588c137550e1a1ef424f6c9ed494823179eac618948e223']
    ] as const)('keeps the original direct Question for %i × %i', (rows, columns, hash) => {
        const data: UnitSquareGridProblem = {kind: 'unit-square-grid', rows, columns,
            tileCount: rows * columns, unitId: 'square-centimeter'};
        const question = renderToStaticMarkup(<UnitSquareGridView payload={payload(data, 'shape-square-array')}
            task="execution" useStory={false} viewId="shape-square-array" />);
        expect(createHash('sha256').update(question).digest('hex')).toBe(hash);
        expect(question).toContain('Blank area answer');
        expect(question).not.toContain('Area =');
    });

    it('uses an achievable single-tile instruction and withholds its answer in Question', () => {
        const data: UnitSquareGridProblem = {kind: 'unit-square-grid', rows: 1, columns: 1,
            tileCount: 1, unitId: 'square-centimeter'};
        const question = renderToStaticMarkup(<UnitSquareGridView payload={payload(data, 'shape-square-array')}
            task="execution" useStory={false} viewId="shape-square-array" />);
        const solution = renderToStaticMarkup(<UnitSquareGridView payload={solutionPayload(data, 'shape-square-array')}
            task="execution" useStory={false} viewId="shape-square-array" />);
        for (const markup of [question, solution]) {
            expect(markup).toContain('Count the unit-square tile once');
            expect(markup).not.toMatch(/arrows|[→↓←]/);
        }
        expect(question).toContain('Blank area answer');
        expect(question).not.toContain('Area =');
        expect(solution).toContain('Area = 1 square centimeters');
    });

    // Other task projections must not adopt direct counting-path changes.
    it.each([
        ['execution', true, 'shape-square-array-story', false, '18cfe0b7c0d7468cdab159f502f85f7c4583d4be85d36f2fa87320c2bcad921f'],
        ['execution', true, 'shape-square-array-story', true, '7ab5c75a6181311c201b5a2aa149e1718c0beec6643607a06375c37fa1f5323d'],
        ['understanding', false, 'shape-square-array-understanding', false, '0c23beb8ee954839c1b2322f7d3f4506c9b9a80525bc04111709cb7dfecf085d'],
        ['understanding', false, 'shape-square-array-understanding', true, '2e479e4e97ee6a84c75cfa1c6a0f102f546a7aa9c3bbf5bfda486f4510c8e8bc'],
        ['inversion', false, 'shape-square-array-inversion', false, '6741a0a75bb5f29e23eaf72039ed3667a70ec0a0c611f19a1a68707187e6c48b'],
        ['inversion', false, 'shape-square-array-inversion', true, '6ad81d47d05deed260d634a24afc5edb9d2b85b5f73a7ec279b7347f96e10a9d']
    ] as const)('keeps %s, story %s, %s, Solution %s unchanged', (task, useStory, viewId, isSolution, hash) => {
        const data: UnitSquareGridProblem = {kind: 'unit-square-grid', rows: 3, columns: 2,
            tileCount: 6, unitId: 'square-centimeter'};
        const markup = renderToStaticMarkup(<UnitSquareGridView
            payload={isSolution ? solutionPayload(data, viewId) : payload(data, viewId)}
            task={task} useStory={useStory} viewId={viewId} />);
        expect(createHash('sha256').update(markup).digest('hex')).toBe(hash);
        expect(markup).not.toMatch(/start|[→↓←]/);
    });

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
