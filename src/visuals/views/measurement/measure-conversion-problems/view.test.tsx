import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {MeasurementConversionStoryProblem} from '../../../../types/problems.ts';
import {formatUnitEquivalence, getMeasurementUnitPresentation} from '../../../helpers/measurement-conversion.ts';
import {formatConversionMeasurement} from '../measure-conversion-helpers.ts';
import {pairs, storyFor} from './fixtures.ts';

let MeasureConversionProblemsCore: typeof import('./view.tsx').MeasureConversionProblemsCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    MeasureConversionProblemsCore = (await import('./view.tsx')).MeasureConversionProblemsCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: MeasurementConversionStoryProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-problems'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'measure-conversion-problems', targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionProblemsCore config={{}} payload={payload} />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('two-step conversion story projection', () => {
    it.each(pairs)('asks an unresolved story and solves both steps for $id', pair => {
        for (const sourceSide of ['larger', 'smaller'] as const) {
            for (const numberKind of ['integer', 'decimal'] as const) {
                const data = storyFor(pair, sourceSide, numberKind);
                const question = visible(render(data, false));
                const solution = visible(render(data, true));
                const targetUnit = sourceSide === 'larger' ? pair.smallerUnit : pair.largerUnit;
                const convertedHundredths = sourceSide === 'larger'
                    ? data.conversion.smallerHundredths : data.conversion.largerHundredths;
                const converted = formatConversionMeasurement(convertedHundredths, targetUnit);
                const answer = formatConversionMeasurement(data.totalTargetHundredths, targetUnit);
                expect(question).toContain(formatUnitEquivalence(pair));
                expect(question).toContain('Write a conversion equation, then add the two amounts');
                expect(question).toContain(getMeasurementUnitPresentation(targetUnit).plural);
                expect(question).toContain('Total: ?');
                expect(question).not.toContain(converted);
                expect(question).not.toContain(answer);
                expect(question).not.toContain(' × ');
                expect(question).not.toContain(' ÷ ');
                expect(question).not.toContain(' + ');
                expect(solution).toContain(converted);
                expect(solution).toContain(answer);
                expect(solution).toContain(sourceSide === 'larger' ? ' × ' : ' ÷ ');
                expect(solution).toContain(' + ');
            }
        }
    });

    it('uses natural singular units for one-unit givens', () => {
        const data = storyFor(pairs[3], 'larger', 'integer');
        data.conversion = {largerHundredths: 100, smallerHundredths: 1600};
        data.totalTargetHundredths = 1900;
        const question = visible(render(data, false));
        expect(question).toContain('1 pound');
        expect(question).toContain('3 ounces');
        expect(question).not.toContain('1 pounds');
    });

    it('fails early if the canonical total is inconsistent', () => {
        const data = storyFor(pairs[5], 'smaller', 'decimal');
        expect(() => render({...data, totalTargetHundredths: data.totalTargetHundredths + 1}, false))
            .toThrow('exact two-step measurement conversion story');
    });
});
