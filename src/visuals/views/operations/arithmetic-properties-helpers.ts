import {ArithmeticPropertyProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export const propertyNames = {
    commutative: 'Commutative property',
    associative: 'Associative property',
    distributive: 'Distributive property'
} as const;

export function validateArithmeticProperty(data: ArithmeticPropertyProblem, viewId: string): void {
    validateProblemData(viewId, data, ['num1', 'num2', 'num3', 'operation', 'answer', 'propertyLaw']);
    const fail = (message: string): never => { throw new ViewValidationError(viewId, message); };
    if (!['addition', 'multiplication'].includes(data.operation)
        || !['commutative', 'associative', 'distributive'].includes(data.propertyLaw)) {
        fail('Expected an addition or multiplication property relation.');
    }

    const values = [data.num1, data.num2, data.num3, data.answer];
    if (data.propertyLaw === 'commutative' && data.num1 === data.num3) {
        fail('The commutative relation requires different first and last values to make their exchange visible.');
    }
    if (data.propertyLaw === 'distributive') {
        validateProblemData(viewId, data, ['combinedFactor', 'partialProducts']);
        if (!Array.isArray(data.partialProducts) || data.partialProducts.length !== 2) {
            fail('A distributive relation requires both partial products.');
        }
        values.push(data.combinedFactor, ...data.partialProducts);
        if (data.operation !== 'multiplication'
            || data.combinedFactor !== data.num2 + data.num3
            || data.partialProducts[0] !== data.num1 * data.num2
            || data.partialProducts[1] !== data.num1 * data.num3
            || data.answer !== data.partialProducts[0] + data.partialProducts[1]) {
            fail('The distributive relation must preserve the sum, both partial products, and their total.');
        }
    } else {
        const expected = data.operation === 'addition'
            ? data.num1 + data.num2 + data.num3
            : data.num1 * data.num2 * data.num3;
        if (data.answer !== expected) fail('Reordering or regrouping must preserve the three-operand result.');
        if (data.propertyLaw === 'associative' && data.operation === 'multiplication') {
            values.push(data.num1 * data.num2, data.num2 * data.num3);
        }
    }
    if (values.some(value => !Number.isInteger(value) || value < 0 || value > 100)) {
        fail('Property equations support whole-number values from 0 through 100.');
    }
}

export function propertyExplanationPrompt(data: ArithmeticPropertyProblem): string {
    if (data.propertyLaw === 'distributive') {
        return `Explain how to multiply both parts of the sum by ${data.num1}, and why adding the partial products gives the original product.`;
    }
    const quantity = data.operation === 'addition' ? 'sum' : 'product';
    return data.propertyLaw === 'commutative'
        ? `Explain which numbers change places and why the ${quantity} stays the same.`
        : `Explain how the parentheses change which calculation is done first, and why the ${quantity} stays the same.`;
}

export function propertyExplanation(data: ArithmeticPropertyProblem): {method: string; reason: string} {
    if (data.propertyLaw === 'distributive') {
        return {
            method: `Split ${data.combinedFactor} into ${data.num2} + ${data.num3}. Multiply both parts by ${data.num1} to get ${data.partialProducts[0]} and ${data.partialProducts[1]}, then add those partial products to get ${data.answer}.`,
            reason: `Both parts of the original sum are multiplied by the same factor, ${data.num1}. Adding their products includes the whole original sum, with neither part skipped nor counted twice.`
        };
    }
    const addition = data.operation === 'addition';
    const terms = addition ? 'addends' : 'factors';
    const result = addition ? 'sum' : 'product';
    if (data.propertyLaw === 'commutative') {
        return {
            method: `Switch the first and last ${terms}, ${data.num1} and ${data.num3}, while keeping ${data.num2} in the middle.`,
            reason: `The same three ${terms} are still used, each exactly once. Only their order changes, so the ${result} remains ${data.answer}.`
        };
    }
    const action = addition ? 'add' : 'multiply';
    return {
        method: `On the left, ${action} ${data.num1} and ${data.num2} first. On the right, ${action} ${data.num2} and ${data.num3} first. Then include the remaining ${addition ? 'addend' : 'factor'}.`,
        reason: `The parentheses change the first calculation, but the same three ${terms} stay in the same order and each is used once. Regrouping them preserves the ${result}, ${data.answer}.`
    };
}
