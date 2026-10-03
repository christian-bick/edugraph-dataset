import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {MeasurementLinePlotProblemsGenerator} from '../../../../generators/statistics/measurement-line-plot-problems/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {MeasurementLinePlotFractionProblem} from '../../../../types/problems.ts';
import {buildFractionLinePlotPresentation} from './helpers.ts';
import {cases, fixtureFor} from './fixtures.ts';

let MeasurementLinePlotProblemsCore: typeof import('./view.tsx').MeasurementLinePlotProblemsCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    MeasurementLinePlotProblemsCore = (await import('./view.tsx')).MeasurementLinePlotProblemsCore;
});
afterAll(() => vi.unstubAllGlobals());

const render = (data: MeasurementLinePlotFractionProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'measurement-line-plot-problems'> = {
        problem: {type: 'statistics', data, labels: []},
        viewId: 'measurement-line-plot-problems', targetLabels: [], isSolutionView, seed: 9
    };
    return renderToStaticMarkup(<MeasurementLinePlotProblemsCore config={{}} payload={payload} />);
};

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('contextual fractional line plot projection', () => {
    it.each(cases)('accepts seeded producer data for $operation / 1/$denominator', ({denominator, operation}) => {
        const generator = new MeasurementLinePlotProblemsGenerator();
        for (let seed = 0; seed < 12; seed++) {
            setSeed(`${denominator}-${operation}-${seed}`);
            const data = generator.generate({denominator, operation}).data;
            expect(() => render(data, false)).not.toThrow();
            expect(() => render(data, true)).not.toThrow();
        }
    });

    it.each(cases)('renders question and solution for $operation / 1/$denominator', ({denominator, operation}) => {
        const data = fixtureFor(denominator, operation);
        const presentation = buildFractionLinePlotPresentation(data);
        const questionMarkup = render(data, false);
        const solutionMarkup = render(data, true);
        const question = visible(questionMarkup);
        const solution = visible(solutionMarkup);
        expect(question).toContain(presentation.story);
        expect(question).toContain('Each X represents one beaker.');
        expect(question).toContain(`Each tick interval is ${denominator === 2 ? '½' : denominator === 4 ? '¼' : '⅛'} cup.`);
        expect(questionMarkup.match(/>×</g)).toHaveLength(5);
        expect(solutionMarkup.match(/>×</g)).toHaveLength(5);
        expect(question).toContain('Answer: ?');
        expect(questionMarkup).toContain('Blank calculation');
        for (const equation of presentation.equations) {
            expect(question).not.toContain(equation);
            expect(solution).toContain(equation);
        }
        expect(solution).toContain(presentation.answer);
        expect(solution).not.toContain('Answer: ?');
    });

    it.each([2, 4, 8] as const)('shows the total before the five-way equal share at 1/%d', denominator => {
        const data = fixtureFor(denominator, 'division');
        const solution = visible(render(data, true));
        const presentation = buildFractionLinePlotPresentation(data);
        expect(presentation.equations).toHaveLength(2);
        expect(solution.indexOf(presentation.equations[0]!)).toBeLessThan(solution.indexOf(presentation.equations[1]!));
        expect(solution).toContain('÷ 5 =');
        expect(solution).toContain('per beaker');
    });

    it('rejects a false plotted relation before any output', () => {
        const data = fixtureFor(4, 'multiplication');
        expect(() => render({...data, relation: {
            operation: 'multiplication', operandNumerator: 5, frequency: 3, resultNumerator: 16
        }}, false)).toThrow('five exact fractional beaker measurements');
    });
});
