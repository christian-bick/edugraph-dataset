import {MeasurementDataProblem, MeasurementExtremaProblem, MeasurementExtremaRelation} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {formatMeasurementValue, validateMeasurementData} from './helpers.ts';

export type MeasurementLinePlotTick = {
    value: number;
    display: string;
    count: number;
};

export type MeasurementLinePlotModel = {
    start: number;
    end: number;
    step: number;
    ticks: MeasurementLinePlotTick[];
};

const sameNumber = (left: number, right: number): boolean => Math.abs(left - right) < Number.EPSILON * 8;

export const validateMeasurementExtremaRelation = (
    data: MeasurementExtremaProblem,
    viewId: string
): MeasurementExtremaRelation => {
    validateProblemData(viewId, data, ['extremaRelation']);
    validateMeasurementData(data, viewId);
    const relation = data.extremaRelation;

    const lengths = data.observations.map(({value}) => value);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    const isAddition = relation.operation === 'addition';
    if (!isAddition && relation.operation !== 'subtraction') {
        throw new ViewValidationError(viewId, 'The extrema relation operation is invalid.');
    }
    const answer = isAddition ? shortest + longest : longest - shortest;
    if (!sameNumber(relation.shortest, shortest)
        || !sameNumber(relation.longest, longest)
        || !sameNumber(relation.answer, answer)) {
        throw new ViewValidationError(viewId, 'The extrema relation must agree with the supplied measurements.');
    }
    return relation;
};

export const buildMeasurementLinePlot = (
    data: MeasurementDataProblem,
    viewId: string
): MeasurementLinePlotModel => {
    validateMeasurementData(data, viewId);
    const values = data.observations.map(({value}) => value);
    const step = 1 / data.subdivisions;
    const start = data.subdivisions === 8 ? Math.floor(Math.min(...values)) : 2;
    const end = data.subdivisions === 8 ? start + 2 : data.subdivisions === 1 ? 10 : 8;
    const intervalCount = Math.round((end - start) / step);
    if (values.some(value => value < start || value > end)) {
        throw new ViewValidationError(viewId, 'The supplied measurements do not fit the derived line-plot scale.');
    }
    const ticks = Array.from({length: intervalCount + 1}, (_, index) => {
        const value = start + index * step;
        return {
            value,
            display: formatMeasurementValue(value, data.unit),
            count: values.filter(observation => sameNumber(observation, value)).length
        };
    });
    return {start, end, step, ticks};
};
