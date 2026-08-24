import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ArithmeticPatternsGenerator} from '../../../generators/arithmetic/arithmetic-patterns/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperationTablePatternProblem,
    ArithmeticRecurrencePatternProblem
} from '../../../types/problems.ts';
import {PatternExplanationMode, PatternExplanationView} from './pattern-explanation-view.tsx';
import {PatternTableView} from './pattern-table-view.tsx';

const generator = new ArithmeticPatternsGenerator();

function tableProblem(): ArithmeticOperationTablePatternProblem {
    setSeed(17);
    return generator.generate({
        model: 'operation-table',
        operation: 'multiplication',
        useCommutativeLaw: false,
        useAssociativeLaw: false,
        useDistributiveLaw: false
    })!.data as ArithmeticOperationTablePatternProblem;
}

function recurrenceProblem(withLaw: boolean): ArithmeticRecurrencePatternProblem {
    setSeed(17);
    return generator.generate({
        model: 'recurrence',
        operation: 'multiplication',
        useCommutativeLaw: false,
        useAssociativeLaw: false,
        useDistributiveLaw: withLaw
    })!.data as ArithmeticRecurrencePatternProblem;
}

function payload<T>(data: T, isSolutionView: boolean): RenderPayload<AbstractProblem<T>> {
    return {
        problem: {type: 'arithmetic', data},
        viewId: 'test-pattern-view',
        labels: [],
        isSolutionView,
        seed: 23
    };
}

describe('pattern leaf renderers', () => {
    it('renders the canonical operation-table classification', () => {
        for (const isSolutionView of [false, true]) {
            const markup = renderToStaticMarkup(
                <PatternTableView
                    mode="legacy-classification"
                    payload={payload(tableProblem(), isSolutionView)}
                    viewId="pattern-legacy-classification"
                    focusOperand={3}
                />
            );
            expect(markup).not.toContain('Invalid problem data');
            expect(markup).toContain('Classify the table pattern');
            expect(markup).toContain('Increase by 3');
        }
    });

    it.each([
        'generation',
        'feature-classification'
    ] as const)('renders the canonical recurrence in %s mode', mode => {
        for (const withLaw of [false, true]) {
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(
                    <PatternTableView
                        mode={mode}
                        payload={payload(recurrenceProblem(withLaw), isSolutionView)}
                        viewId={`pattern-${mode}`}
                        missingTermIndex={3}
                    />
                );
                expect(markup).not.toContain('Invalid problem data');
                expect(markup.toLowerCase()).toContain('pattern');
            }
        }
    });

    it('makes recurrence execution explicit in generation and feature-classification modes', () => {
        const data = recurrenceProblem(false);
        const generationQuestion = renderToStaticMarkup(
            <PatternTableView
                mode="generation"
                payload={payload(data, false)}
                viewId="pattern-generation"
                missingTermIndex={3}
            />
        );
        const generationSolution = renderToStaticMarkup(
            <PatternTableView
                mode="generation"
                payload={payload(data, true)}
                viewId="pattern-generation"
                missingTermIndex={3}
            />
        );
        expect(generationQuestion).toContain('>?</div>');
        expect(generationSolution).toContain(`Missing term: ${data.terms[3]}`);

        const featureQuestion = renderToStaticMarkup(
            <PatternTableView
                mode="feature-classification"
                payload={payload(data, false)}
                viewId="pattern-feature"
            />
        );
        const featureSolution = renderToStaticMarkup(
            <PatternTableView
                mode="feature-classification"
                payload={payload(data, true)}
                viewId="pattern-feature"
            />
        );
        expect(featureQuestion).toContain('Complete the missing term, then choose');
        expect(featureQuestion).toContain('>?</div>');
        expect(featureSolution).toContain(`Missing term: ${data.terms[3]}`);
        expect(featureSolution).toContain('After the starting term, every term is even.');
    });

    it.each([
        'legacy-explanation',
        'generation-practice',
        'feature-explanation'
    ] as PatternExplanationMode[])('renders the canonical recurrence in %s mode', mode => {
        for (const withLaw of [false, true]) {
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(
                    <PatternExplanationView
                        mode={mode}
                        payload={payload(recurrenceProblem(withLaw), isSolutionView)}
                        viewId={`pattern-${mode}`}
                        missingTermIndex={3}
                    />
                );
                expect(markup).not.toContain('Invalid problem data');
                expect(markup.toLowerCase()).toContain('number pattern');
            }
        }
    });

    it('rejects a recurrence in the operation-table-only classification mode', () => {
        expect(() => renderToStaticMarkup(
            <PatternTableView
                mode="legacy-classification"
                payload={payload(recurrenceProblem(false), false)}
                viewId="pattern-table-only"
                focusOperand={3}
            />
        )).toThrow('requires an operation-table model');
    });

    it.each(['generation', 'feature-classification'] as const)(
        'rejects an operation table in the %s recurrence mode',
        mode => {
            expect(() => renderToStaticMarkup(
                <PatternTableView
                    mode={mode}
                    payload={payload(tableProblem(), false)}
                    viewId={`pattern-${mode}`}
                    missingTermIndex={3}
                />
            )).toThrow('requires a recurrence model');
        }
    );

    it('makes execution and explanation outcomes explicit in the stronger feature leaf', () => {
        const data = recurrenceProblem(true);
        const question = renderToStaticMarkup(
            <PatternExplanationView
                mode="feature-explanation"
                payload={payload(data, false)}
                viewId="pattern-feature-explanation"
            />
        );
        const solution = renderToStaticMarkup(
            <PatternExplanationView
                mode="feature-explanation"
                payload={payload(data, true)}
                viewId="pattern-feature-explanation"
            />
        );
        expect(question).toContain('Complete the missing term, then explain');
        expect(question).toContain('>?</div>');
        expect(question).toContain('Write why this feature continues.');
        expect(solution).toContain(`Missing term: ${data.terms[3]}`);
        expect(solution).toContain('The distributive property rewrites');
    });
});
