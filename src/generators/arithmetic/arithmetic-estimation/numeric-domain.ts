import type {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';

export type EstimationRelation = Omit<ArithmeticEstimationProblem, 'proposal'>;
export interface EstimationConstructionDomain {readonly operation: ArithmeticOperation; readonly minimum: number; readonly maximum: number}
const apply = (left: number, right: number, operation: ArithmeticOperation) => operation === 'addition' ? left + right
    : operation === 'subtraction' ? left - right : operation === 'multiplication' ? left * right : left / right;
const round = (value: number) => Math.round(value / 10) * 10;

export function estimationRelation(domain: EstimationConstructionDomain, first: number, second: number): EstimationRelation | null {
    const {operation, minimum, maximum} = domain;
    const num1 = operation === 'subtraction' ? first + second : operation === 'division' ? first * second : first;
    const num2 = operation === 'subtraction' || operation === 'division' ? first : second;
    const roundedNum1 = round(num1), roundedNum2 = round(num2);
    if (roundedNum1 === num1 && roundedNum2 === num2 || roundedNum2 === 0) return null;
    const exactAnswer = apply(num1, num2, operation), estimatedAnswer = apply(roundedNum1, roundedNum2, operation);
    if (![num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer, round(estimatedAnswer)]
        .every(value => Number.isInteger(value) && value >= minimum && value <= maximum)) return null;
    return {numberDomain: {min: minimum, max: maximum}, num1, num2, roundedNum1, roundedNum2,
        exactAnswer, estimatedAnswer, operation, roundingPlace: 10};
}

/** Original first/second hierarchy and its unconditional pair probability, without a random draw. */
export function* estimationRawRows({operation, minimum, maximum}: EstimationConstructionDomain) {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || maximum > 1000
        || minimum >= maximum || Math.ceil(minimum / 10) >= Math.floor(maximum / 10)) return;
    const minOperand = Math.max(1, minimum, maximum < 22 ? 1 : 11);
    const firstMax = operation === 'addition' ? Math.min(700, maximum - minOperand)
        : operation === 'subtraction' ? Math.min(400, maximum - minOperand) : Math.min(49, maximum);
    for (let first = minOperand; first <= firstMax; first++) {
        const secondMin = operation === 'division' ? Math.max(2, minimum) : minOperand;
        const secondMax = operation === 'addition' || operation === 'subtraction' ? maximum - first
            : operation === 'multiplication' ? Math.min(49, Math.floor(maximum / first))
                : Math.min(80, Math.floor(maximum / first));
        yield {first, secondMin, secondMax,
            pairWeight: 1 / (firstMax - minOperand + 1) / (secondMax - secondMin + 1)};
    }
}
