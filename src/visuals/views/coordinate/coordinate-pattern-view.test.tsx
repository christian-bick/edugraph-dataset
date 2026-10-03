import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {CoordinatePatternPairsProblem} from '../../../types/problems.ts';
import {CoordinatePatternMode, CoordinatePatternView, CoordinatePatternViewId} from './coordinate-pattern-view.tsx';

const data: CoordinatePatternPairsProblem = {
    kind: 'coordinate-pattern-pairs',
    first: {start: 0, rule: {kind: 'add-constant', increment: 2}, terms: [0, 2, 4, 6]},
    second: {start: 1, rule: {kind: 'add-constant', increment: 3}, terms: [1, 4, 7, 10]},
    points: [{x: 0, y: 1}, {x: 2, y: 4}, {x: 4, y: 7}, {x: 6, y: 10}]
};

function render(mode: CoordinatePatternMode, viewId: CoordinatePatternViewId, isSolutionView = false): string {
    const payload: ViewRenderPayload<CoordinatePatternViewId> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId, targetLabels: [], isSolutionView, seed: 4
    };
    return renderToStaticMarkup(<CoordinatePatternView mode={mode} payload={payload} viewId={viewId} />);
}

describe('coordinate pattern view tasks', () => {
    it('keeps source sequences and given pair list while withholding plotted points in Question', () => {
        const question = render('plot', 'coordinate-plot-pattern-pairs');
        const solution = render('plot', 'coordinate-plot-pattern-pairs', true);
        expect(question).toContain('Pattern A');
        expect(question).toContain('Pattern B');
        expect(question).toContain('Start <strong>0</strong>; add <strong>2</strong>');
        expect(question).toContain('Start <strong>1</strong>; add <strong>3</strong>');
        expect(question).toContain('A (0, 1)');
        expect(question).toContain('D (6, 10)');
        expect(question).toContain('horizontal x-coordinate');
        expect(question).toContain('vertical y-coordinate');
        expect(question).toContain('>x</text>');
        expect(question).toContain('>y</text>');
        expect(question).not.toContain('<circle');
        expect(solution.match(/<circle/g)).toHaveLength(8);
        expect(solution).toContain('>A</text>');
        expect(solution).toContain('>D</text>');
    });

    it('asks for notation without a grid and reveals correctly ordered pairs only in Solution', () => {
        const question = render('form', 'coordinate-form-pattern-pairs');
        const solution = render('form', 'coordinate-form-pattern-pairs', true);
        expect(question).toContain('first (x) component');
        expect(question).toContain('second (y) component');
        expect(question).toContain('( __ , __ )');
        expect(question).not.toContain('(0, 1)');
        expect(question).not.toContain('<svg');
        expect(solution).toContain('(0, 1)');
        expect(solution).toContain('(6, 10)');
        expect(solution).not.toContain('<svg');
    });
});
