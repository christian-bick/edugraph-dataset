import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalRoundingProblem} from '../../../../types/problems.ts';
import {roundingCase} from './fixtures.ts';

let NumbersDecimalRoundingLineCore: typeof import('./view.tsx').NumbersDecimalRoundingLineCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    NumbersDecimalRoundingLineCore = (await import('./view.tsx')).NumbersDecimalRoundingLineCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: DecimalRoundingProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'numbers-decimal-rounding-line'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'numbers-decimal-rounding-line', targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<NumbersDecimalRoundingLineCore config={{}} payload={payload} />);
}

describe('numbers-decimal-rounding-line view', () => {
    it('asks for a hundredths result with candidates and midpoint but no selected endpoint', () => {
        const data = roundingCase({name: 'hundredths', quantumInTenThousandths: 100}, 99900, 99950);
        const question = render(data, false);
        expect(question).toContain('Round 9.995 to the nearest hundredth.');
        expect(question).toContain('>9.99</text>');
        expect(question).toContain('>10.00</text>');
        expect(question).toContain('midpoint 9.995');
        expect(question).toContain('9.995 → ___');
        expect(question).not.toContain('fill="#059669"');
        expect(question).not.toContain('round up to 10.00');
    });

    it('reveals the upward tie and keeps the source point visible above the selected marker', () => {
        const data = roundingCase({name: 'hundredths', quantumInTenThousandths: 100}, 99900, 99950);
        const solution = render(data, true);
        expect(solution).toContain('9.995 → 10.00');
        expect(solution).toContain('halfway between 9.99 and 10.00');
        expect(solution).toContain('fill="#059669"');
        expect(solution.indexOf('fill="#2563eb"')).toBeGreaterThan(solution.indexOf('fill="#059669"'));
    });

    it('keeps a near-zero thousandths source separate from the zero candidate', () => {
        const data = roundingCase({name: 'thousandths', quantumInTenThousandths: 10}, 0, 1);
        const question = render(data, false);
        const solution = render(data, true);
        expect(question).toContain('Round 0.0001 to the nearest thousandth.');
        expect(question).toContain('>0.000</text>');
        expect(question).toContain('>0.001</text>');
        expect(question).toContain('cx="152"');
        expect(solution).toContain('0.0001 → 0.000');
        expect(solution).toContain('round down to 0.000');
    });

    it('rejects an incoherent mathematical witness before drawing', () => {
        const data = roundingCase({name: 'ones', quantumInTenThousandths: 10000}, 90000, 95000);
        expect(() => render({...data, midpointInTenThousandths: 94000}, false)).toThrow('inconsistent');
    });
});
