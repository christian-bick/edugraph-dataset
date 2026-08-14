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
    validateProblemData(viewId, data, ['unit', 'subdivisions', 'observations']);
    if (!Array.isArray(data.observations) || data.observations.length !== 6) {
        throw new ViewValidationError(viewId, 'Expected six length observations.');
    }
    if (data.observations.some(({object}, index) => object !== expectedObjects[index])) {
        throw new ViewValidationError(viewId, 'Measurement objects or their order are invalid.');
    }
    if (data.unit === 'cm' && data.subdivisions === 1) {
        if (data.observations.some(({length}) => !Number.isInteger(length) || length < 2 || length > 10)) {
            throw new ViewValidationError(viewId, 'Centimeter lengths must be whole numbers from 2 through 10.');
        }
        return;
    }
    if (data.unit === 'in' && data.subdivisions === 4) {
        const quarterUnits = data.observations.map(({length}) => length * 4);
        if (quarterUnits.some(value => !Number.isInteger(value) || value < 8 || value > 32)
            || !quarterUnits.some(value => value % 4 === 2)
            || !quarterUnits.some(value => value % 2 === 1)) {
            throw new ViewValidationError(viewId, 'Inch lengths must use quarter-inch ticks and include half- and quarter-inch data.');
        }
        return;
    }
    throw new ViewValidationError(viewId, 'Measurement unit and subdivisions are incompatible.');
}

export function formatMeasurement(length: number, unit: MeasurementDataProblem['unit']): string {
    if (unit === 'cm') return `${length} cm`;
    const quarterUnits = Math.round(length * 4);
    const whole = Math.floor(quarterUnits / 4);
    const fraction = ['', '¼', '½', '¾'][quarterUnits % 4];
    return `${whole}${fraction} in`;
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
        if (data.operandIndices !== undefined || data.intermediate !== undefined || data.answer !== undefined) {
            throw new ViewValidationError(viewId, 'Presentation-only graph data cannot include a partial arithmetic question.');
        }
        return;
    }
    if (!['addition', 'subtraction'].includes(data.operation)
        || !Array.isArray(data.operandIndices)
        || ![2, 3].includes(data.operandIndices.length)
        || !Number.isInteger(data.answer)) {
        throw new ViewValidationError(viewId, 'Arithmetic graph question fields are incomplete.');
    }
    const [firstIndex, secondIndex, thirdIndex] = data.operandIndices;
    const first = data.categories[firstIndex]?.count;
    const second = data.categories[secondIndex]?.count;
    if (first === undefined || second === undefined || new Set(data.operandIndices).size !== data.operandIndices.length) {
        throw new ViewValidationError(viewId, 'Arithmetic operands must reference distinct graph categories.');
    }
    if (data.operandIndices.length === 3) {
        const third = data.categories[thirdIndex!]?.count;
        const intermediate = first - second;
        if (data.operation !== 'subtraction'
            || third === undefined
            || data.intermediate !== intermediate
            || data.answer !== intermediate - third
            || data.answer < 0) {
            throw new ViewValidationError(viewId, 'Two-step graph subtraction is inconsistent.');
        }
        return;
    }
    if (data.intermediate !== undefined) {
        throw new ViewValidationError(viewId, 'One-step graph questions cannot include an intermediate result.');
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
    const [firstIndex, secondIndex, thirdIndex] = data.operandIndices;
    const first = data.categories[firstIndex].label.toLowerCase();
    const second = data.categories[secondIndex].label.toLowerCase();
    if (data.operandIndices.length === 3) {
        const third = data.categories[thirdIndex!].label.toLowerCase();
        return `How many more ${first} are there than ${second} and ${third} together?`;
    }
    return data.operation === 'addition'
        ? `How many ${first} and ${second} are there altogether?`
        : `How many more ${first} are there than ${second}?`;
}
