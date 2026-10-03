import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionBenchmarkArithmeticGenerator} from '../../../generators/fraction/fraction-benchmark-arithmetic/generator.ts';
import {FractionBenchmarkBody} from './fraction-benchmark-view.tsx';

const generator = new FractionBenchmarkArithmeticGenerator();

describe('fraction benchmark views', () => {
    for (const operation of ['addition', 'subtraction'] as const) {
        for (const approximationModel of ['bounds-only', 'nearest-quarter'] as const) {
            it(`${operation} ${approximationModel} keeps each question open and explains both solutions`, () => {
                setSeed(`view-render-${operation}-${approximationModel}`);
                const data = generator.generate({operation, approximationModel}).data;
                const estimateQ = renderToStaticMarkup(<FractionBenchmarkBody data={data} task="estimate" isSolutionView={false} />);
                const estimateS = renderToStaticMarkup(<FractionBenchmarkBody data={data} task="estimate" isSolutionView={true} />);
                const judgmentQ = renderToStaticMarkup(<FractionBenchmarkBody data={data} task="reasonableness" isSolutionView={false} />);
                const judgmentS = renderToStaticMarkup(<FractionBenchmarkBody data={data} task="reasonableness" isSolutionView={true} />);

                for (const markup of [estimateQ, estimateS, judgmentQ, judgmentS]) {
                    expect(markup).toContain('same whole');
                    expect(markup).toContain('1/2');
                    expect(markup).toContain('role="img"');
                    expect(markup).toContain('A:');
                    expect(markup).toContain('B:');
                }
                expect(estimateQ).toContain('from ______ to ______');
                expect(estimateQ).not.toContain('Lower:');
                expect(estimateQ).not.toContain('A nearest-quarter estimate');
                expect(estimateS).toContain('Lower:');
                expect(estimateS).toContain('Upper:');
                expect(estimateS).toContain('The result lies from');
                expect(estimateS.includes('A nearest-quarter estimate')).toBe(approximationModel === 'nearest-quarter');

                expect(judgmentQ).toContain('Proposed result:');
                expect(judgmentQ).toContain('Reasonable or unreasonable? ______');
                expect(judgmentQ).not.toContain('Lower:');
                expect(judgmentS).toContain('Lower:');
                expect(judgmentS).toContain(data.candidate.judgment === 'reasonable'
                    ? 'Reasonable:' : 'Unreasonable:');
                expect(judgmentS).not.toContain('A nearest-quarter estimate');
            });
        }
    }
});
