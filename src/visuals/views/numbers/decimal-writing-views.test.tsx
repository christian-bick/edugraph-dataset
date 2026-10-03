import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';

const placeholder: DecimalWritingProblem = {
    kind: 'decimal-writing', base: 10, wholePart: 5,
    valueInThousandths: 5008, canonicalNumeral: '5.008',
    fractionalPart: {precision: 'thousandths', digits: [0, 0, 8], numerator: 8, denominator: 1000}
};

let ReadingCore: typeof import('./numbers-decimal-numeral-reading/view.tsx').NumbersDecimalNumeralReadingCore;
let NumeralWritingCore: typeof import('./numbers-decimal-numeral-writing/view.tsx').NumbersDecimalNumeralWritingCore;
let NameWritingCore: typeof import('./numbers-decimal-name-writing/view.tsx').NumbersDecimalNameWritingCore;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    ReadingCore = (await import('./numbers-decimal-numeral-reading/view.tsx')).NumbersDecimalNumeralReadingCore;
    NumeralWritingCore = (await import('./numbers-decimal-numeral-writing/view.tsx')).NumbersDecimalNumeralWritingCore;
    NameWritingCore = (await import('./numbers-decimal-name-writing/view.tsx')).NumbersDecimalNameWritingCore;
});
afterAll(() => vi.unstubAllGlobals());

function payload<T extends 'numbers-decimal-numeral-reading' | 'numbers-decimal-numeral-writing' | 'numbers-decimal-name-writing'>(
    viewId: T,
    isSolutionView: boolean
): ViewRenderPayload<T> {
    return {problem: {type: 'arithmetic', data: placeholder, labels: []}, viewId, targetLabels: [], isSolutionView, seed: 13};
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('decimal reading and writing leaf views', () => {
    it('uses an unmarked receptive choice task, then marks one exact meaning', () => {
        const question = renderToStaticMarkup(<ReadingCore payload={payload('numbers-decimal-numeral-reading', false)} />);
        const solution = renderToStaticMarkup(<ReadingCore payload={payload('numbers-decimal-numeral-reading', true)} />);
        expect(visible(question)).toContain('5.008');
        expect(visible(question)).toContain('five and eight thousandths');
        expect(question).not.toContain('✓');
        expect(solution).toContain('✓');
    });

    it('withholds the answer numeral while eliciting digits and a separator', () => {
        const question = visible(renderToStaticMarkup(<NumeralWritingCore payload={payload('numbers-decimal-numeral-writing', false)} />));
        const solution = visible(renderToStaticMarkup(<NumeralWritingCore payload={payload('numbers-decimal-numeral-writing', true)} />));
        expect(question).toContain('five and eight thousandths');
        expect(question).toContain('decimal point');
        expect(question).not.toContain('5.008');
        expect(solution).toContain('5.008');
        expect(solution).toContain('0');
    });

    it('shows the numeral but withholds its written name until Solution Mode', () => {
        const question = visible(renderToStaticMarkup(<NameWritingCore payload={payload('numbers-decimal-name-writing', false)} />));
        const solution = visible(renderToStaticMarkup(<NameWritingCore payload={payload('numbers-decimal-name-writing', true)} />));
        expect(question).toContain('5.008');
        expect(question).not.toContain('five and eight thousandths');
        expect(solution).toContain('five and eight thousandths');
    });
});
