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

export function formatMeasurementValue(length: number, unit: MeasurementDataProblem['unit']): string {
    if (unit === 'cm') return String(length);
    const quarterUnits = Math.round(length * 4);
    const whole = Math.floor(quarterUnits / 4);
    const fraction = ['', '¼', '½', '¾'][quarterUnits % 4];
    return `${whole}${fraction}`;
}

export function formatMeasurement(length: number, unit: MeasurementDataProblem['unit']): string {
    return `${formatMeasurementValue(length, unit)} ${unit}`;
}

export function validateStatisticalGraph(data: StatisticalGraphProblem, viewId: string) {
    validateProblemData(viewId, data, ['task', 'graphState', 'categories', 'scale']);
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

    const rejectFields = (fields: (keyof StatisticalGraphProblem)[]) => {
        const present = fields.find(field => data[field] !== undefined);
        if (present !== undefined) {
            throw new ViewValidationError(viewId, `Task ${data.task} cannot include field ${present}.`);
        }
    };
    const validatePrompt = (prompt: string) => {
        if (typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new ViewValidationError(viewId, `Task ${data.task} requires a non-empty prompt.`);
        }
    };
    const validateOperands = (indices: readonly number[]) => {
        if (indices.some(index => !Number.isInteger(index) || index < 0 || index > 2)
            || new Set(indices).size !== indices.length) {
            throw new ViewValidationError(viewId, 'Arithmetic operands must reference distinct graph categories.');
        }
        return indices.map(index => data.categories[index].count);
    };

    switch (data.task) {
        case 'construct':
            if (data.graphState !== 'to-construct') {
                throw new ViewValidationError(viewId, 'Construct tasks require a graph to construct.');
            }
            rejectFields(['operation', 'operandIndices', 'intermediate', 'answer', 'rawObservations', 'selectedCategoryIndex', 'selectedCategory', 'prompt']);
            return;
        case 'organize': {
            if (data.graphState !== 'to-construct' || data.scale !== 1) {
                throw new ViewValidationError(viewId, 'Organize tasks require a graph to construct.');
            }
            validatePrompt(data.prompt);
            rejectFields(['operation', 'operandIndices', 'intermediate', 'answer', 'selectedCategoryIndex', 'selectedCategory']);
            if (!Array.isArray(data.rawObservations)
                || data.rawObservations.some(label => !expectedLabels.includes(label))) {
                throw new ViewValidationError(viewId, 'Organize observations must use the three graph category labels.');
            }
            for (const category of data.categories) {
                const frequency = data.rawObservations.filter(label => label === category.label).length;
                if (frequency !== category.count) {
                    throw new ViewValidationError(viewId, 'Raw observation frequencies must equal the category totals.');
                }
            }
            return;
        }
        case 'read-category-count':
            if (data.graphState !== 'complete' || data.scale !== 1) {
                throw new ViewValidationError(viewId, 'Read tasks require a complete graph.');
            }
            validatePrompt(data.prompt);
            rejectFields(['operation', 'operandIndices', 'intermediate', 'rawObservations']);
            if (![0, 1, 2].includes(data.selectedCategoryIndex)
                || data.selectedCategory !== data.categories[data.selectedCategoryIndex].label
                || !Number.isInteger(data.answer)
                || data.answer !== data.categories[data.selectedCategoryIndex].count) {
                throw new ViewValidationError(viewId, 'Selected category and count answer are inconsistent.');
            }
            return;
        case 'find-total': {
            if (data.graphState !== 'complete'
                || data.scale !== 1
                || data.operation !== 'addition'
                || data.operandIndices.length !== 3
                || data.operandIndices.some((index, position) => index !== position)) {
                throw new ViewValidationError(viewId, 'Find-total tasks require all three categories in order.');
            }
            validatePrompt(data.prompt);
            rejectFields(['intermediate', 'rawObservations', 'selectedCategoryIndex', 'selectedCategory']);
            const total = data.categories.reduce((sum, category) => sum + category.count, 0);
            if (!Number.isInteger(data.answer) || data.answer !== total) {
                throw new ViewValidationError(viewId, 'Find-total answer must equal all three category totals.');
            }
            return;
        }
        case 'single-step-arithmetic': {
            if (data.graphState !== 'complete' || !['addition', 'subtraction'].includes(data.operation)) {
                throw new ViewValidationError(viewId, 'Single-step graph arithmetic requires a complete graph and operation.');
            }
            rejectFields(['intermediate', 'rawObservations', 'selectedCategoryIndex', 'selectedCategory', 'prompt']);
            const [first, second] = validateOperands(data.operandIndices);
            const expected = data.operation === 'addition' ? first + second : first - second;
            if (!Number.isInteger(data.answer) || data.answer !== expected || data.answer < 0) {
                throw new ViewValidationError(viewId, 'Single-step graph arithmetic is inconsistent.');
            }
            return;
        }
        case 'multi-step-arithmetic': {
            if (data.graphState !== 'complete' || data.operation !== 'subtraction') {
                throw new ViewValidationError(viewId, 'Multi-step graph arithmetic requires complete subtraction data.');
            }
            rejectFields(['rawObservations', 'selectedCategoryIndex', 'selectedCategory', 'prompt']);
            const [first, second, third] = validateOperands(data.operandIndices);
            if (data.intermediate !== first - second
                || data.answer !== data.intermediate - third
                || data.answer < 0) {
                throw new ViewValidationError(viewId, 'Multi-step graph subtraction is inconsistent.');
            }
            return;
        }
        default:
            throw new ViewValidationError(viewId, 'Unsupported statistical graph task.');
    }
}

export function graphQuestion(data: StatisticalGraphProblem): string {
    if (data.task !== 'single-step-arithmetic' && data.task !== 'multi-step-arithmetic') {
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
