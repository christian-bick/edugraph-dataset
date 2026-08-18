import {PlaceValueArithmeticProblem, PlaceValueDigits} from '../../../../types/problems.ts';

const digitsFor = (value: number): PlaceValueDigits => ({
    hundreds: Math.floor(value / 100),
    tens: Math.floor((value % 100) / 10),
    ones: value % 10
});

export const operationSymbol = (
    operation: PlaceValueArithmeticProblem['operation']
): '+' | '−' => operation === 'addition' ? '+' : '−';

export const writtenDigits = (value: number): readonly [string, string, string] => {
    const digits = digitsFor(value);
    return [
        value >= 100 ? String(digits.hundreds) : '',
        value >= 10 ? String(digits.tens) : '',
        String(digits.ones)
    ];
};
