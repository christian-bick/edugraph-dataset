import {describe, expect, it} from 'vitest';
import {MeasurementDataProblem, MeasurementObservation} from '../../../types/problems.ts';
import {buildMeasurementLinePlot, validateMeasurementExtremaRelation} from './measurement-line-plot-helpers.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];
const problem = (lengths: readonly number[], subdivisions: 1 | 4 | 8): MeasurementDataProblem => ({
    unit: subdivisions === 1 ? 'cm' : 'in',
    subdivisions,
    observations: objects.map((object, index) => ({object, value: lengths[index]!}))
});

describe('measurement line-plot projection', () => {
    it('derives whole-unit frequencies from canonical observations', () => {
        const data = problem([2, 3, 4, 4, 7, 10], 1);
        const model = buildMeasurementLinePlot(data, 'fixture');

        expect(model).toMatchObject({start: 2, end: 10, step: 1});
        expect(model.ticks.find(({value}) => value === 4)?.count).toBe(2);
        expect(model.ticks.reduce((sum, {count}) => sum + count, 0)).toBe(6);
    });

    it('derives an exact two-inch eighth scale from supplied measurements', () => {
        const data = problem([1.125, 1.25, 1.5, 1.5, 2.625, 3], 8);
        const model = buildMeasurementLinePlot(data, 'fixture');

        expect(model).toMatchObject({start: 1, end: 3, step: 0.125});
        expect(model.ticks).toHaveLength(17);
        expect(model.ticks[1]).toMatchObject({display: '1⅛', count: 1});
        expect(model.ticks[4]).toMatchObject({display: '1½', count: 2});
    });

    it('validates a canonical extrema relation and rejects missing or inconsistent arithmetic', () => {
        const data = problem([1.125, 1.25, 1.5, 1.5, 2.625, 3], 8);
        const relation = {
            operation: 'subtraction',
            shortest: 1.125,
            longest: 3,
            leftOperand: 3,
            rightOperand: 1.125,
            answer: 1.875
        } as const;
        data.extremaRelation = relation;
        expect(validateMeasurementExtremaRelation(data, 'fixture', true)).toEqual(relation);
        expect(() => validateMeasurementExtremaRelation({...data, extremaRelation: undefined}, 'fixture', true)).toThrow();
        expect(() => validateMeasurementExtremaRelation({
            ...data,
            extremaRelation: {...relation, answer: 2}
        }, 'fixture', true)).toThrow();
    });
});
