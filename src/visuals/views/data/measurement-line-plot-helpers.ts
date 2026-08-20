import {MeasurementDataProblem, MeasurementExtremaRelation} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
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
    data: MeasurementDataProblem,
    viewId: string,
    required: boolean
): MeasurementExtremaRelation | undefined => {
    const relation = data.extremaRelation;
    if (relation === undefined) {
        if (required) {
            throw new ViewValidationError(viewId, 'The arithmetic view requires a canonical extrema relation.');
        }
        return undefined;
    }

    const lengths = data.observations.map(({value}) => value);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    const isAddition = relation.operation === 'addition';
    if (!isAddition && relation.operation !== 'subtraction') {
        throw new ViewValidationError(viewId, 'The extrema relation operation is invalid.');
    }
    const leftOperand = isAddition ? shortest : longest;
    const rightOperand = isAddition ? longest : shortest;
    const answer = isAddition ? leftOperand + rightOperand : leftOperand - rightOperand;
    if (!sameNumber(relation.shortest, shortest)
        || !sameNumber(relation.longest, longest)
        || !sameNumber(relation.leftOperand, leftOperand)
        || !sameNumber(relation.rightOperand, rightOperand)
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
    const end = data.subdivisions === 8 ? start + 2 : data.unit === 'cm' ? 10 : 8;
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
