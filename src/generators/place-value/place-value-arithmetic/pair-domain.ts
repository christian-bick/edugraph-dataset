import type {PlaceValueArithmeticOperandProfile} from '../../../types/problems.ts';
import type {PlaceValueArithmeticGeneratorConfig} from './spec.ts';

type OperandPair = readonly [number, number];

export const operandProfile = (
    config: PlaceValueArithmeticGeneratorConfig
): PlaceValueArithmeticOperandProfile | null => {
    if (config.requireSingleDigitSmallest && config.requireMultipleOf10) return null;
    if (config.requireSingleDigitSmallest) {
        return config.requireTwoDigitLargest ? 'two-digit-single-digit' : null;
    }
    if (config.requireMultipleOf10) {
        return config.requireTwoDigitLargest
            ? 'two-digit-multiple-of-ten'
            : 'multiples-of-ten';
    }
    return config.requireTwoDigitLargest ? null : 'general';
};

export const grade1AdditionPairs = (
    profile: PlaceValueArithmeticOperandProfile,
    minimum: number,
    maximum: number,
    requireRegrouping: boolean
): OperandPair[] => {
    const pairs: OperandPair[] = [];
    if (profile === 'two-digit-single-digit') {
        for (let twoDigit = Math.max(10, minimum); twoDigit <= Math.min(99, maximum); twoDigit++) {
            for (let singleDigit = Math.max(1, minimum); singleDigit <= 9; singleDigit++) {
                const answer = twoDigit + singleDigit;
                const composesTen = twoDigit % 10 + singleDigit >= 10;
                if (answer <= maximum && composesTen === requireRegrouping) {
                    pairs.push([twoDigit, singleDigit]);
                }
            }
        }
    } else if (profile === 'two-digit-multiple-of-ten' && !requireRegrouping) {
        for (let twoDigit = Math.max(10, minimum); twoDigit <= Math.min(99, maximum); twoDigit++) {
            for (let multiple = 10; multiple <= Math.min(90, maximum); multiple += 10) {
                if (twoDigit + multiple <= maximum) pairs.push([twoDigit, multiple]);
            }
        }
    }
    return pairs;
};

export const grade1SubtractionPairs = (
    minimum: number,
    maximum: number,
    requireZero: boolean
): OperandPair[] => {
    const pairs: OperandPair[] = [];
    for (let minuend = 10; minuend <= Math.min(90, maximum); minuend += 10) {
        if (minuend < minimum) continue;
        for (let subtrahend = 10; subtrahend <= minuend; subtrahend += 10) {
            if (subtrahend < minimum) continue;
            const isZero = minuend === subtrahend;
            if (isZero === requireZero) pairs.push([minuend, subtrahend]);
        }
    }
    return pairs;
};
