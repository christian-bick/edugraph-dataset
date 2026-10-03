import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ArithmeticPairedPatternProblem} from '../../../types/problems.ts';
import {PairedPatternMode, PairedPatternView, PairedPatternViewId} from './paired-pattern-view.tsx';

const data: ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns',
    first: {start: 0, rule: {kind: 'add-constant', increment: 3}, terms: [0, 3, 6, 9, 12, 15]},
    second: {start: 0, rule: {kind: 'add-constant', increment: 6}, terms: [0, 6, 12, 18, 24, 30]},
    correspondence: {kind: 'multiplicative', factor: 2}
};

const independent: ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns',
    first: data.first,
    second: {start: 1, rule: {kind: 'add-constant', increment: 5}, terms: [1, 6, 11, 16, 21, 26]}
};

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

function render(
    mode: PairedPatternMode,
    viewId: PairedPatternViewId,
    isSolutionView = false,
    pattern = data
): string {
    const payload: ViewRenderPayload<PairedPatternViewId> = {
        problem: {type: 'arithmetic', data: pattern, labels: []},
        viewId, targetLabels: [], isSolutionView, seed: 41
    };
    return visible(renderToStaticMarkup(<PairedPatternView mode={mode} payload={payload} viewId={viewId} />));
}

describe('paired-pattern view family', () => {
    it('asks for a relationship without leaking it and keeps both aligned rows visible', () => {
        const question = render('identify', 'operations-pattern-correspondence');
        const solution = render('identify', 'operations-pattern-correspondence', true);
        expect(question).toContain('Pattern A rule');
        expect(question).toContain('Pattern B rule');
        expect(question).toContain('0 3 6 9 12 15');
        expect(question).toContain('0 6 12 18 24 30');
        expect(question).not.toContain('2 times Pattern A');
        expect(solution).toContain('2 times Pattern A');
    });

    it('asks for a written causal explanation and connects starts and steps in the solution', () => {
        const question = render('explain', 'operations-pattern-correspondence-explanation');
        const solution = render('explain', 'operations-pattern-correspondence-explanation', true);
        expect(question).toContain('2 times Pattern A');
        expect(question).toContain('Explain why');
        expect(question).not.toContain('2 times the first increase');
        expect(solution).toContain('starts at 0 and adds 3 each step');
        expect(solution).toContain('starts at 0, 2 times the first start, and adds 6');
        expect(solution).toContain('2 times the first increase');
    });

    it('hides later terms of both sequences in Question and reveals both full rows in Solution', () => {
        const question = render('generate', 'operations-paired-pattern-generation', false, independent);
        const solution = render('generate', 'operations-paired-pattern-generation', true, independent);
        expect(question.match(/\?/g)).toHaveLength(10);
        expect(question).not.toContain('0 3 6 9 12 15');
        expect(question).not.toContain('2 times Pattern A');
        expect(solution).toContain('0 3 6 9 12 15');
        expect(solution).toContain('1 6 11 16 21 26');
    });

    it('rejects correspondence tasks when the canonical relation is absent', () => {
        expect(() => render('identify', 'operations-pattern-correspondence', false, independent))
            .toThrow('requires an exact relation');
        expect(() => render('explain', 'operations-pattern-correspondence-explanation', false, independent))
            .toThrow('requires an exact relation');
    });
});
