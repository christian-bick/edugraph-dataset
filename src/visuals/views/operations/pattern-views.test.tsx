import {Area} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticPatternsGenerator} from '../../../generators/arithmetic/arithmetic-patterns/generator.ts';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPatternProblem} from '../../../types/problems.ts';
import {PatternExplanationMode, PatternExplanationView} from './pattern-explanation-view.tsx';
import {PatternTableMode, PatternTableView} from './pattern-table-view.tsx';

const generator = new ArithmeticPatternsGenerator();

function problem(withLaw: boolean): ArithmeticPatternProblem {
    setSeed(17);
    return generator.generate({
        operation: Area.Multiplication,
        useCommutativeLaw: false,
        useAssociativeLaw: false,
        useDistributiveLaw: withLaw
    })!.data;
}

function payload(data: ArithmeticPatternProblem, isSolutionView: boolean): RenderPayload<AbstractProblem<ArithmeticPatternProblem>> {
    return {
        problem: {type: 'arithmetic', data},
        viewId: 'test-pattern-view',
        labels: [],
        isSolutionView,
        seed: 23
    };
}

describe('pattern leaf renderers', () => {
    it.each([
        'legacy-classification',
        'generation',
        'feature-classification'
    ] as PatternTableMode[])('renders the canonical payload in %s mode', mode => {
        for (const withLaw of [false, true]) {
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(
                    <PatternTableView
                        mode={mode}
                        payload={payload(problem(withLaw), isSolutionView)}
                        viewId={`pattern-${mode}`}
                    />
                );
                expect(markup).not.toContain('Invalid problem data');
                expect(markup.toLowerCase()).toContain('pattern');
            }
        }
    });

    it.each([
        'legacy-explanation',
        'generation-practice',
        'feature-explanation'
    ] as PatternExplanationMode[])('renders the canonical payload in %s mode', mode => {
        for (const withLaw of [false, true]) {
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(
                    <PatternExplanationView
                        mode={mode}
                        payload={payload(problem(withLaw), isSolutionView)}
                        viewId={`pattern-${mode}`}
                    />
                );
                expect(markup).not.toContain('Invalid problem data');
                expect(markup.toLowerCase()).toContain('number pattern');
            }
        }
    });
});
