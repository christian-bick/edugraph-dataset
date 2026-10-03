import type {DecimalAdjacentPlaceScalingProblem} from '../../../../types/problems.ts';

export const wholeCase: DecimalAdjacentPlaceScalingProblem = {
    kind: 'decimal-adjacent-place-scaling',
    digits: [0, 5, 5, 0, 0, 0],
    numberInThousandths: 55000,
    repeatedDigit: 5,
    higherPlace: {name: 'tens', exponent: 1, digitIndex: 1, unitInThousandths: 10000, digitValueInThousandths: 50000},
    lowerPlace: {name: 'ones', exponent: 0, digitIndex: 2, unitInThousandths: 1000, digitValueInThousandths: 5000},
    scale: {factor: 10, reciprocalNumerator: 1, reciprocalDenominator: 10}
};

export const fractionalCase: DecimalAdjacentPlaceScalingProblem = {
    kind: 'decimal-adjacent-place-scaling',
    digits: [0, 0, 0, 0, 5, 5],
    numberInThousandths: 55,
    repeatedDigit: 5,
    higherPlace: {name: 'hundredths', exponent: -2, digitIndex: 4, unitInThousandths: 10, digitValueInThousandths: 50},
    lowerPlace: {name: 'thousandths', exponent: -3, digitIndex: 5, unitInThousandths: 1, digitValueInThousandths: 5},
    scale: {factor: 10, reciprocalNumerator: 1, reciprocalDenominator: 10}
};

export const decimalBoundaryCase: DecimalAdjacentPlaceScalingProblem = {
    kind: 'decimal-adjacent-place-scaling',
    digits: [0, 0, 5, 5, 0, 0],
    numberInThousandths: 5500,
    repeatedDigit: 5,
    higherPlace: {name: 'ones', exponent: 0, digitIndex: 2, unitInThousandths: 1000, digitValueInThousandths: 5000},
    lowerPlace: {name: 'tenths', exponent: -1, digitIndex: 3, unitInThousandths: 100, digitValueInThousandths: 500},
    scale: {factor: 10, reciprocalNumerator: 1, reciprocalDenominator: 10}
};
