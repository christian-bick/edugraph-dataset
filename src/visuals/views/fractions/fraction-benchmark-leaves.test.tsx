import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionBenchmarkArithmeticGenerator} from '../../../generators/fraction/fraction-benchmark-arithmetic/generator.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {FractionBenchmarkArithmeticProblem} from '../../../types/problems.ts';

let EstimateCore: typeof import('./fractions-benchmark-estimate/view.tsx').FractionsBenchmarkEstimateCore;
let ReasonablenessCore: typeof import('./fractions-benchmark-reasonableness/view.tsx').FractionsBenchmarkReasonablenessCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    EstimateCore = (await import('./fractions-benchmark-estimate/view.tsx')).FractionsBenchmarkEstimateCore;
    ReasonablenessCore = (await import('./fractions-benchmark-reasonableness/view.tsx')).FractionsBenchmarkReasonablenessCore;
});
afterAll(() => vi.unstubAllGlobals());

const generator = new FractionBenchmarkArithmeticGenerator();
const renderEstimate = (data: FractionBenchmarkArithmeticProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'fractions-benchmark-estimate'> = {
        problem: {type: 'fraction', data, labels: []}, viewId: 'fractions-benchmark-estimate',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<EstimateCore payload={payload} />);
};
const renderReasonableness = (data: FractionBenchmarkArithmeticProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'fractions-benchmark-reasonableness'> = {
        problem: {type: 'fraction', data, labels: []}, viewId: 'fractions-benchmark-reasonableness',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<ReasonablenessCore payload={payload} />);
};

describe('fraction benchmark leaf participation', () => {
    it('accepts both operations and both producer profiles in both leaves and modes', () => {
        for (const operation of ['addition', 'subtraction'] as const) {
            for (const approximationModel of ['bounds-only', 'nearest-quarter'] as const) {
                for (let seed = 0; seed < 15; seed++) {
                    setSeed(`benchmark-leaf-${operation}-${approximationModel}-${seed}`);
                    const data = generator.generate({operation, approximationModel}).data;
                    for (const render of [renderEstimate, renderReasonableness]) {
                        expect(() => render(data, false)).not.toThrow();
                        expect(() => render(data, true)).not.toThrow();
                    }
                }
            }
        }
    });

    it('rejects a contradictory result bound in both leaves', () => {
        setSeed('benchmark-invalid-leaf');
        const data = generator.generate({operation: 'addition', approximationModel: 'nearest-quarter'}).data;
        const invalid = {...data, resultBounds: {...data.resultBounds, lower: {numerator: 2, denominator: 1}}};
        for (const render of [renderEstimate, renderReasonableness]) {
            expect(() => render(invalid, false)).toThrow(/Validation Error/);
        }
    });
});
