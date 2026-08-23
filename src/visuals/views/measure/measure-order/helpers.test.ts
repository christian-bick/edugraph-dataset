import {describe, expect, it} from 'vitest';
import {MeasurementOrderProblem} from '../../../../types/problems.ts';
import {resolveMeasurementOrderPresentation} from './helpers.ts';

const ascending: MeasurementOrderProblem = {
    magnitudes: [70, 110, 160],
    direction: 'ascending'
};

describe('measurement order presentation', () => {
    it('covers all six A/B/C placements deterministically', () => {
        const placements = new Set<string>();
        for (let seed = 0; seed < 6; seed++) {
            const first = resolveMeasurementOrderPresentation(ascending, seed);
            const second = resolveMeasurementOrderPresentation(ascending, seed);
            expect(second).toEqual(first);
            placements.add(first.objects.map(object => object.length).join(','));
            expect(first.answerIds.map(id =>
                first.objects.find(object => object.id === id)!.length
            )).toEqual([70, 110, 160]);
        }
        expect(placements.size).toBe(6);
    });

    it('derives descending answers from the same seeded placement', () => {
        const data = {...ascending, direction: 'descending'} as const;
        const presentation = resolveMeasurementOrderPresentation(data, 4);
        expect(presentation.answerIds.map(id =>
            presentation.objects.find(object => object.id === id)!.length
        )).toEqual([160, 110, 70]);
    });

    it('normalizes signed, fractional, and non-finite seeds', () => {
        expect(resolveMeasurementOrderPresentation(ascending, -4.9)).toEqual(
            resolveMeasurementOrderPresentation(ascending, 4)
        );
        expect(resolveMeasurementOrderPresentation(ascending, Number.NaN)).toEqual(
            resolveMeasurementOrderPresentation(ascending, 0)
        );
    });
});
