import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import * as rng from '../../../lib/random.ts';
import {MeasureLengthCore} from '../../../visuals/views/measure/measure-length/view.tsx';
import {MeasurementLengthGenerator} from './generator.ts';
import {rulerLengthCaseCount, rulerRangeProfiles} from './numeric-domain.ts';

describe('canonical ruler consumers', () => {
    it('renders both existing tasks at every band boundary while retaining the same measured value', () => {
        const generator = new MeasurementLengthGenerator(), draw = vi.spyOn(rng, 'random');
        try {
            for (const length of [1, 5, 6, 10, 11, 20, 21, 50, 51, 100]) {
                const {range} = rulerRangeProfiles.find(({range}) => length <= range.max && length > range.maximumAbove)!;
                const first = Math.max(1, range.maximumAbove + 1);
                const count = rulerLengthCaseCount(false, range);
                draw.mockReturnValue((length - first + 0.5) / count);
                for (const tool of [Scope.PhysicalRuler, Scope.Tapemeter]) {
                    const {data} = generator.generate({range, useDecimals: false, tool});
                    expect(data.problemLength).toBe(length);
                    for (const isReverse of [false, true]) for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(<MeasureLengthCore isReverse={isReverse} payload={{
                            problem: {type: 'measurement', data, labels: []}, isSolutionView
                        }} />);
                        expect(markup).toContain(tool === Scope.PhysicalRuler ? 'Ruler' : 'Measuring tape');
                        expect(markup).toContain('>0</text>');
                        expect(markup).toContain(`>${data.bandLength}</text>`);
                        if (length <= 5) expect(markup).not.toContain('>10</text>');
                        expect(markup).toContain('cm');
                        if (isSolutionView) expect(markup).toContain(`>${length}<span`);
                        if (isReverse && !isSolutionView) expect(markup).toContain('Draw an object');
                    }
                }
            }
        } finally { draw.mockRestore(); }
    });
});
