import {renderToStaticMarkup} from 'react-dom/server';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalAdjacentPlaceScalingProblem} from '../../../../types/problems.ts';
import {decimalBoundaryCase, fractionalCase, wholeCase} from './fixtures.ts';

let NumbersDecimalPlaceValueScalingCore: typeof import('./view.tsx').NumbersDecimalPlaceValueScalingCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    NumbersDecimalPlaceValueScalingCore = (await import('./view.tsx')).NumbersDecimalPlaceValueScalingCore;
});

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

function render(data: DecimalAdjacentPlaceScalingProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'numbers-decimal-place-value-scaling'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'numbers-decimal-place-value-scaling',
        targetLabels: [], isSolutionView, seed: 23
    };
    return visible(renderToStaticMarkup(<NumbersDecimalPlaceValueScalingCore config={{}} payload={payload} />));
}

describe('numbers-decimal-place-value-scaling view', () => {
    it('shows a whole-and-fractional place chart while asking for both unknown ratios', () => {
        const question = render(wholeCase, false);
        expect(question).toContain('55.000');
        expect(question).toContain('hundreds tens ones tenths hundredths thousandths');
        expect(question).toContain('50 = ___ × 5');
        expect(question).toContain('5 = 50 ÷ ___ = ( ___ ) × 50');
        expect(question).not.toContain('50 = 10 × 5');
        expect(question).not.toContain('one tenth as large');
    });

    it('derives both directions for fractional digit values', () => {
        const solution = render(fractionalCase, true);
        expect(solution).toContain('0.055');
        expect(solution).toContain('0.05 = 10 × 0.005');
        expect(solution).toContain('0.005 = 0.05 ÷ 10 = (1/10) × 0.05');
        expect(solution).toContain('one tenth as large');
    });

    it('preserves exact place values across the decimal point', () => {
        const solution = render(decimalBoundaryCase, true);
        expect(solution).toContain('5.500');
        expect(solution).toContain('5 = 10 × 0.5');
        expect(solution).toContain('0.5 = 5 ÷ 10 = (1/10) × 5');
    });
});
