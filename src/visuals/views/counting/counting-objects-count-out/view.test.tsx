import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingSelectionProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';
import {CountingObjectsCountOutViewConfig} from './spec.ts';
import {CountingObjectsCountOutCore} from './view.tsx';

const arrangements = [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement] as const;

function problem(numObjects: number, availableCount: number): CountingSelectionProblem {
    return {numObjects, availableCount, simpleAnswer: numObjects};
}

function render(
    data: CountingSelectionProblem,
    isSolutionView: boolean,
    seed = 17,
    arrangement: CountingObjectsCountOutViewConfig['arrangement'] = Scope.ScatteredArrangement
): string {
    const payload: ViewRenderPayload<'counting-objects-count-out'> = {
        problem: {type: 'counting', data, labels: []}, viewId: 'counting-objects-count-out',
        targetLabels: [], isSolutionView, seed
    };
    return renderToStaticMarkup(<CountingObjectsCountOutCore config={{arrangement}} payload={payload} />);
}

function objects(markup: string): string[] {
    return markup.match(/<img\b[^>]*alt="counting object"[^>]*>/g) ?? [];
}

function coloredObjects(markup: string): string[] {
    return objects(markup).filter(object => !object.includes('grayscale'));
}

function positions(markup: string): string[] {
    return [...markup.matchAll(/style="(left:[^"]+)"/g)].map(([, position]) => position);
}

describe('counting-objects-count-out selection projection', () => {
    it.each(arrangements)('preserves the supplied pool and selects exactly the requested count in %s', arrangement => {
        const data = problem(6, 9);
        const question = render(data, false, 17, arrangement);
        const solution = render(data, true, 17, arrangement);

        expect(question).toContain('Color exactly 6 objects.');
        expect(question).not.toContain('Colored:');
        expect(objects(question)).toHaveLength(9);
        expect(coloredObjects(question)).toHaveLength(0);

        expect(solution).toContain('Colored: 6');
        expect(solution).not.toContain('Color exactly');
        expect(objects(solution)).toHaveLength(9);
        expect(coloredObjects(solution)).toHaveLength(6);
        expect(positions(solution)).toEqual(positions(question));
    });

    it.each(arrangements)('allows a pool equal to a request below the upper bound in %s', arrangement => {
        const data = problem(6, 6);
        const question = render(data, false, 17, arrangement);
        const solution = render(data, true, 17, arrangement);

        expect(question).toContain('Color exactly 6 objects.');
        expect(objects(question)).toHaveLength(6);
        expect(coloredObjects(question)).toHaveLength(0);
        expect(objects(solution)).toHaveLength(6);
        expect(coloredObjects(solution)).toHaveLength(6);
        expect(solution).toContain('Colored: 6');
        expect(solution).not.toMatch(/remaining|remainder|left over/i);
    });

    it.each([1, 10, 20])('allows selecting the whole supplied pool of %s objects', count => {
        const data = problem(count, count);
        expect(objects(render(data, false))).toHaveLength(count);
        expect(coloredObjects(render(data, false))).toHaveLength(0);
        expect(coloredObjects(render(data, true))).toHaveLength(count);
    });

    it('uses singular wording when requesting one object', () => {
        const question = render(problem(1, 6), false);
        expect(question).toContain('Color exactly 1 object.');
        expect(question).not.toContain('Color exactly 1 objects.');
    });

    it('keeps the mathematical quantities fixed when only the presentation seed changes', () => {
        const data = problem(5, 9);
        expect(render(data, false, 17)).toEqual(render(data, false, 17));
        expect(render(data, false, 18)).not.toEqual(render(data, false, 17));
        for (const seed of [17, 18, 99]) {
            expect(objects(render(data, false, seed))).toHaveLength(9);
            expect(coloredObjects(render(data, false, seed))).toHaveLength(0);
            expect(coloredObjects(render(data, true, seed))).toHaveLength(5);
        }
    });

    it.each([
        {numObjects: undefined}, {numObjects: null},
        {availableCount: undefined}, {availableCount: null},
        {numObjects: 0}, {numObjects: -1}, {numObjects: 1.5},
        {numObjects: Number.NaN}, {numObjects: Number.POSITIVE_INFINITY}, {numObjects: '6'},
        {availableCount: 5}, {availableCount: -1}, {availableCount: 6.5},
        {availableCount: Number.NaN}, {availableCount: Number.POSITIVE_INFINITY}, {availableCount: '9'}
    ])('rejects invalid counts before rendering: %j', invalid => {
        const data = {...problem(6, 9), ...invalid} as unknown as CountingSelectionProblem;
        expect(() => render(data, false)).toThrow(ViewValidationError);
        expect(() => render(data, true)).toThrow(ViewValidationError);
    });

    it('rejects missing problem data', () => {
        expect(() => render(undefined as unknown as CountingSelectionProblem, false)).toThrow(ViewValidationError);
    });

    it('rejects unsupported arrangements instead of silently substituting a layout', () => {
        expect(() => render(problem(6, 9), false, 17, Scope.BoxArrangement as CountingObjectsCountOutViewConfig['arrangement']))
            .toThrow(ViewValidationError);
    });
});
