import type {PlaceValueArithmeticOperandProfile} from '../../../types/problems.ts';
import type {PlaceValueArithmeticGeneratorConfig} from './spec.ts';
import {Area} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {hasPrimaryWidth, matchesMultipleOf10Presence, primaryWidthRows} from './width-domain.ts';

type OperandPair = readonly [number, number];

export const operandProfile = (
    config: PlaceValueArithmeticGeneratorConfig
): PlaceValueArithmeticOperandProfile | null => {
    if (config.multipleOf10Presence !== undefined && !config.requireTwoDigitLargest && !config.requireSingleDigitSmallest) {
        if (config.operation === Area.Subtraction) {
            // Full H/T/O arithmetic with both operands divisible by ten always
            // exposes a zero ones coefficient. Its absence distinguishes the
            // retained positive whole-tens arithmetic, without a sampler flag.
            return config.requireMultipleOf10 || config.multipleOf10Presence
                && config.coefficientPresence === false && !config.requireZero ? 'multiples-of-ten' : 'general';
        }
    }
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

/** Exact finite feasibility, including the retained original mathematical domain. */
export const hasNativePairs = (config: PlaceValueArithmeticGeneratorConfig): boolean => {
    const profile = operandProfile(config), range = config.range;
    if (!profile || !range || range.min !== 0 || ![5, 10, 20, 100, 120, 1000].includes(range.max)) return false;
    const maximum = Math.min(999, range.max), floor = createCanonicalNumericRange(range.max).maximumAbove;
    const width = config.largestOperandProfile!;
    if (profile === 'general') return primaryWidthRows({operation: config.operation === Area.Addition ? 'addition' : 'subtraction',
        minimum: 1, maximum, maximumAbove: floor, regrouping: config.requireRegrouping!,
        zeroResult: config.requireZero, coefficientZero: config.coefficientPresence,
        multipleOf10Presence: config.multipleOf10Presence}, width).length > 0;
    if (config.operation === Area.Addition) return !config.requireZero && config.coefficientPresence === true
        && grade1AdditionPairs(profile, 1, maximum, config.requireRegrouping!)
            .some(([a, b]) => a + b > floor && matchesMultipleOf10Presence(a, b, config.multipleOf10Presence) && hasPrimaryWidth(a, b, width));
    return profile === 'multiples-of-ten' && !config.requireRegrouping
        && config.coefficientPresence === config.requireZero
        && grade1SubtractionPairs(1, maximum, config.requireZero!)
            .some(([a, b]) => a > floor && matchesMultipleOf10Presence(a, b, config.multipleOf10Presence) && hasPrimaryWidth(a, b, width));
};
