import {random} from '../../../lib/random.ts';
import type {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type MultiplicativeComparisonQuantityRole =
    | 'reference'
    | 'scale-factor'
    | 'compared';

const REFERENCE_ENTITY = 'Maya';
const COMPARED_ENTITY = 'Leo';

export function validateMultiplicativeComparison(
    viewId: string,
    data: MultiplicativeComparisonProblem
): void {
    const quantities = [data.referenceQuantity, data.scaleFactor, data.comparedQuantity];
    if (quantities.some(value => !Number.isInteger(value) || value <= 0)) {
        throw new ViewValidationError(viewId, 'Comparison quantities must be positive integers.');
    }
    if (data.scaleFactor <= 1 || data.comparedQuantity !== data.referenceQuantity * data.scaleFactor) {
        throw new ViewValidationError(viewId, 'The supplied quantities do not form a multiplicative comparison.');
    }
    if (data.operation !== 'multiplication' && data.operation !== 'division') {
        throw new ViewValidationError(viewId, `Unsupported operation: ${data.operation}`);
    }
}

export function selectMultiplicativeComparisonUnknown(
    operation: MultiplicativeComparisonProblem['operation']
): MultiplicativeComparisonQuantityRole {
    if (operation === 'multiplication') return 'compared';
    return random() < 0.5 ? 'reference' : 'scale-factor';
}

export function presentMultiplicativeComparison(
    data: MultiplicativeComparisonProblem,
    unknownRole: MultiplicativeComparisonQuantityRole
) {
    if ((data.operation === 'multiplication' && unknownRole !== 'compared')
        || (data.operation === 'division' && unknownRole === 'compared')) {
        throw new ViewValidationError(
            'multiplicative-comparison-presentation',
            'The operation does not support the requested unknown role.'
        );
    }
    const comparisonStatement = `${COMPARED_ENTITY} has ${data.scaleFactor} times as many stickers as ${REFERENCE_ENTITY}.`;

    if (unknownRole === 'compared') {
        return {
            unknownRole,
            answer: data.comparedQuantity,
            referenceEntity: REFERENCE_ENTITY,
            comparedEntity: COMPARED_ENTITY,
            story: `${REFERENCE_ENTITY} has ${data.referenceQuantity} stickers. ${comparisonStatement}`,
            question: `How many stickers does ${COMPARED_ENTITY} have?`,
            givenEquation: `${data.referenceQuantity} × ${data.scaleFactor} = ?`,
            solutionEquation: `${data.referenceQuantity} × ${data.scaleFactor} = ${data.comparedQuantity}`,
            comparisonStatement
        };
    }

    if (unknownRole === 'reference') {
        return {
            unknownRole,
            answer: data.referenceQuantity,
            referenceEntity: REFERENCE_ENTITY,
            comparedEntity: COMPARED_ENTITY,
            story: `${COMPARED_ENTITY} has ${data.comparedQuantity} stickers. ${comparisonStatement}`,
            question: `How many stickers does ${REFERENCE_ENTITY} have?`,
            givenEquation: `${data.comparedQuantity} ÷ ${data.scaleFactor} = ?`,
            solutionEquation: `${data.comparedQuantity} ÷ ${data.scaleFactor} = ${data.referenceQuantity}`,
            comparisonStatement
        };
    }

    return {
        unknownRole,
        answer: data.scaleFactor,
        referenceEntity: REFERENCE_ENTITY,
        comparedEntity: COMPARED_ENTITY,
        story: `${REFERENCE_ENTITY} has ${data.referenceQuantity} stickers. ${COMPARED_ENTITY} has ${data.comparedQuantity} stickers.`,
        question: `How many times as many stickers does ${COMPARED_ENTITY} have as ${REFERENCE_ENTITY}?`,
        givenEquation: `${data.comparedQuantity} ÷ ${data.referenceQuantity} = ?`,
        solutionEquation: `${data.comparedQuantity} ÷ ${data.referenceQuantity} = ${data.scaleFactor}`,
        comparisonStatement
    };
}
