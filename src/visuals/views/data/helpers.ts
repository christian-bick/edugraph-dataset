import {MeasurementDataProblem, StatisticalGraphProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export const categoryStyles = [
    {bar: 'bg-rose-400', marker: 'rounded-full bg-rose-400', text: 'text-rose-600'},
    {bar: 'bg-sky-400', marker: 'rounded-sm bg-sky-400', text: 'text-sky-600'},
    {bar: 'bg-amber-400', marker: 'rotate-45 rounded-sm bg-amber-400', text: 'text-amber-600'}
] as const;

const expectedLabels = ['Apples', 'Books', 'Kites'];
const expectedObjects = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

export function validateMeasurementData(data: MeasurementDataProblem, viewId: string) {
    validateProblemData(viewId, data, ['unit', 'observations']);
    if (data.unit !== 'cm' || !Array.isArray(data.observations) || data.observations.length !== 6) {
        throw new ViewValidationError(viewId, 'Expected six centimeter observations.');
    }
    if (data.observations.some(({object}, index) => object !== expectedObjects[index])) {
        throw new ViewValidationError(viewId, 'Measurement objects or their order are invalid.');
    }
    if (data.observations.some(({length}) => !Number.isInteger(length) || length < 2 || length > 10)) {
        throw new ViewValidationError(viewId, 'Observation lengths must be whole centimeters from 2 through 10.');
    }
}

export function validateStatisticalGraph(data: StatisticalGraphProblem, viewId: string) {
    validateProblemData(viewId, data, ['categories', 'scale']);
    if (![1, 2, 5, 10].includes(data.scale)) {
        throw new ViewValidationError(viewId, 'Graph scale must be 1, 2, 5, or 10.');
    }
    if (!Array.isArray(data.categories) || data.categories.length !== 3) {
        throw new ViewValidationError(viewId, 'Expected exactly three statistical categories.');
    }
    if (data.categories.some(({label}, index) => label !== expectedLabels[index])) {
        throw new ViewValidationError(viewId, 'Statistical category labels or their order are invalid.');
    }
    if (data.categories.some(({count}) => !Number.isInteger(count) || count < 0 || count > 8 * data.scale || count % data.scale !== 0)) {
        throw new ViewValidationError(viewId, 'Category totals must be whole-number multiples of the graph scale through eight steps.');
    }
    if (data.operation === undefined) {
        if (data.operandIndices !== undefined || data.answer !== undefined) {
            throw new ViewValidationError(viewId, 'Presentation-only graph data cannot include a partial arithmetic question.');
        }
        return;
    }
    if (!['addition', 'subtraction'].includes(data.operation)
        || !Array.isArray(data.operandIndices)
        || data.operandIndices.length !== 2
        || !Number.isInteger(data.answer)) {
        throw new ViewValidationError(viewId, 'Arithmetic graph question fields are incomplete.');
    }
    const [firstIndex, secondIndex] = data.operandIndices;
    const first = data.categories[firstIndex]?.count;
    const second = data.categories[secondIndex]?.count;
    if (first === undefined || second === undefined || firstIndex === secondIndex) {
        throw new ViewValidationError(viewId, 'Arithmetic operands must reference two distinct graph categories.');
    }
    const expected = data.operation === 'addition' ? first + second : first - second;
    if (!Number.isFinite(expected) || expected !== data.answer || expected < 0) {
        throw new ViewValidationError(viewId, 'Arithmetic graph question is inconsistent.');
    }
}

export function graphQuestion(data: StatisticalGraphProblem): string {
    if (!data.operation || !data.operandIndices) {
        throw new Error('graphQuestion requires an arithmetic graph problem.');
    }
    const [firstIndex, secondIndex] = data.operandIndices;
    const first = data.categories[firstIndex].label.toLowerCase();
    const second = data.categories[secondIndex].label.toLowerCase();
    return data.operation === 'addition'
        ? `How many ${first} and ${second} are there altogether?`
        : `How many more ${first} are there than ${second}?`;
}
