import {
    MeasurementDataProblem,
    StatisticalCategory,
    StatisticalCategoryId,
    StatisticalGraphProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export const statisticalCategoryIds = ['apple', 'book', 'kite'] as const satisfies readonly StatisticalCategoryId[];

const categoryLabels: Record<StatisticalCategoryId, string> = {
    apple: 'Apples',
    book: 'Books',
    kite: 'Kites'
};

export const categoryStyles = {
    apple: {bar: 'bg-rose-400', marker: 'rounded-full bg-rose-400', text: 'text-rose-600'},
    book: {bar: 'bg-sky-400', marker: 'rounded-sm bg-sky-400', text: 'text-sky-600'},
    kite: {bar: 'bg-amber-400', marker: 'rotate-45 rounded-sm bg-amber-400', text: 'text-amber-600'}
} as const satisfies Record<StatisticalCategoryId, {bar: string; marker: string; text: string}>;

export const categoryLabel = (id: StatisticalCategoryId): string => categoryLabels[id];

export const statisticalCategory = (
    data: StatisticalGraphProblem,
    id: StatisticalCategoryId
): StatisticalCategory => data.categories.find(category => category.id === id)!;

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
        if (data.observations.some(({value}) => !Number.isInteger(value) || value < 2 || value > 10)) {
            throw new ViewValidationError(viewId, 'Centimeter lengths must be whole numbers from 2 through 10.');
        }
        return;
    }
    if (data.unit === 'in' && data.subdivisions === 4) {
        const quarterUnits = data.observations.map(({value}) => value * 4);
        if (quarterUnits.some(value => !Number.isInteger(value) || value < 8 || value > 32)
            || !quarterUnits.some(value => value % 4 === 2)
            || !quarterUnits.some(value => value % 2 === 1)) {
            throw new ViewValidationError(viewId, 'Inch lengths must use quarter-inch ticks and include half- and quarter-inch data.');
        }
        return;
    }
    if (data.unit === 'in' && data.subdivisions === 8) {
        const eighthUnits = data.observations.map(({value}) => value * 8);
        if (eighthUnits.some(value => !Number.isInteger(value) || value < 8 || value > 32)
            || !eighthUnits.some(value => value % 8 === 1)
            || !eighthUnits.some(value => value % 8 === 2)
            || !eighthUnits.some(value => value % 8 === 4)) {
            throw new ViewValidationError(viewId, 'Inch lengths must use eighth-inch ticks and include eighth-, quarter-, and half-inch data.');
        }
        return;
    }
    throw new ViewValidationError(viewId, 'Measurement unit and subdivisions are incompatible.');
}

export function formatMeasurementValue(length: number, unit: MeasurementDataProblem['unit']): string {
    if (unit === 'cm') return String(length);
    const eighthUnits = Math.round(length * 8);
    const whole = Math.floor(eighthUnits / 8);
    const fraction = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'][eighthUnits % 8];
    return `${whole}${fraction}`;
}

export function formatMeasurement(length: number, unit: MeasurementDataProblem['unit']): string {
    return `${formatMeasurementValue(length, unit)} ${unit}`;
}

export function validateStatisticalGraph(data: StatisticalGraphProblem, viewId: string) {
    validateProblemData(viewId, data, ['categories', 'scale']);
    if (![1, 2, 5, 10].includes(data.scale)) {
        throw new ViewValidationError(viewId, 'Graph scale must be 1, 2, 5, or 10.');
    }
    if (!Array.isArray(data.categories) || data.categories.length !== 3) {
        throw new ViewValidationError(viewId, 'Expected exactly three statistical categories.');
    }
    if (data.categories.some(({id}, index) => id !== statisticalCategoryIds[index])) {
        throw new ViewValidationError(viewId, 'Statistical category IDs or their canonical order are invalid.');
    }
    if (data.categories.some(({count}) => !Number.isInteger(count) || count < 0 || count > 8 * data.scale || count % data.scale !== 0)) {
        throw new ViewValidationError(viewId, 'Category totals must be whole-number multiples of the graph scale through eight steps.');
    }

    const rejectFields = (fields: (keyof StatisticalGraphProblem)[]) => {
        const present = fields.find(field => data[field] !== undefined);
        if (present !== undefined) {
            throw new ViewValidationError(viewId, `Statistical graph data cannot include field ${present}.`);
        }
    };
    const validateOperands = (ids: readonly StatisticalCategoryId[]) => {
        if (ids.some(id => !statisticalCategoryIds.includes(id))
            || new Set(ids).size !== ids.length) {
            throw new ViewValidationError(viewId, 'Arithmetic operands must reference distinct graph categories.');
        }
        return ids.map(id => statisticalCategory(data, id).count);
    };

    if (data.operation === undefined) {
        rejectFields(['operandCategoryIds', 'intermediate', 'answer']);
        return;
    }
    if (!['addition', 'subtraction'].includes(data.operation)
        || !Array.isArray(data.operandCategoryIds)
        || !Number.isInteger(data.answer)) {
        throw new ViewValidationError(viewId, 'Graph arithmetic requires an operation, operands, and answer.');
    }

    const operands = validateOperands(data.operandCategoryIds);
    if (operands.length === 2) {
        rejectFields(['intermediate']);
        const [first, second] = operands;
        const expected = data.operation === 'addition' ? first + second : first - second;
        if (data.answer !== expected || data.answer < 0) {
            throw new ViewValidationError(viewId, 'Single-step graph arithmetic is inconsistent.');
        }
        return;
    }
    if (operands.length !== 3) {
        throw new ViewValidationError(viewId, 'Graph arithmetic requires two or three distinct category operands.');
    }
    const [first, second, third] = operands;
    if (data.operation === 'addition') {
        if (data.scale !== 1
            || data.operandCategoryIds.some((id, position) => id !== statisticalCategoryIds[position])
            || data.intermediate !== undefined
            || data.answer !== first + second + third) {
            throw new ViewValidationError(viewId, 'Three-operand graph addition is inconsistent.');
        }
        return;
    }
    if (data.intermediate !== first - second
        || data.answer !== data.intermediate - third
        || data.answer < 0) {
        throw new ViewValidationError(viewId, 'Multi-step graph subtraction is inconsistent.');
    }
}

export function graphQuestion(data: StatisticalGraphProblem): string {
    if (!data.operation || !data.operandCategoryIds || data.operandCategoryIds.length < 2) {
        throw new Error('graphQuestion requires an arithmetic graph problem.');
    }
    const [firstId, secondId, thirdId] = data.operandCategoryIds;
    const first = categoryLabel(firstId).toLowerCase();
    const second = categoryLabel(secondId).toLowerCase();
    if (data.operandCategoryIds.length === 3) {
        const third = categoryLabel(thirdId!).toLowerCase();
        return `How many more ${first} are there than ${second} and ${third} together?`;
    }
    return data.operation === 'addition'
        ? `How many ${first} and ${second} are there altogether?`
        : `How many more ${first} are there than ${second}?`;
}
