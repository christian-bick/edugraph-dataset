import type {DecimalWritingProblem} from '../../types/problems.ts';

/** Independent decimal construction: digits encode one complete value. */
export function decimalSource(wholePart: number, digits: [number, number, number], scale: 1 | 2 | 3): DecimalWritingProblem {
    const numerator = Number(digits.slice(0, scale).join(''));
    if (scale === 1 && (digits[1] !== 0 || digits[2] !== 0) || scale === 2 && digits[2] !== 0)
        throw Error('Unused decimal fixture places must be zero.');
    const fractionalPart: DecimalWritingProblem['fractionalPart'] = scale === 1
        ? {precision: 'tenths', digits: [digits[0], 0, 0], numerator, denominator: 10}
        : scale === 2 ? {precision: 'hundredths', digits: [digits[0], digits[1], 0], numerator, denominator: 100}
            : {precision: 'thousandths', digits, numerator, denominator: 1000};
    return {kind: 'decimal-writing', base: 10, wholePart,
        canonicalNumeral: `${wholePart}.${digits.slice(0, scale).join('')}`,
        valueInThousandths: wholePart * 1000 + digits[0] * 100 + digits[1] * 10 + digits[2], fractionalPart};
}

export interface DecimalNativePath {
    data: DecimalWritingProblem;
    fractionDraws: number[];
    /** Original fractional proposal mass at common denominator364500. */
    mass: number;
}

/** Every original hierarchical proposal path, including the two ways to choose
 * a zero tenths digit in hundredths. No production sampler/range helpers used. */
export function decimalNativePaths(whole: number): DecimalNativePath[] {
    const paths: DecimalNativePath[] = [];
    const add = (digits: [number, number, number], scale: 1 | 2 | 3, fractionDraws: number[], mass: number) =>
        paths.push({data: decimalSource(whole, digits, scale), fractionDraws, mass});
    for (let tenth = 1; tenth <= 9; tenth++)
        add([tenth, 0, 0], 1, [0.06, (tenth - 0.5) / 9], 4860);
    for (let hundredth = 1; hundredth <= 9; hundredth++) {
        add([0, hundredth, 0], 2, [0.18, 0.25, (hundredth - 0.5) / 9], 2430);
        for (let tenth = 0; tenth <= 9; tenth++)
            add([tenth, hundredth, 0], 2, [0.18, 0.75, (tenth + 0.5) / 10, (hundredth - 0.5) / 9], 243);
    }
    for (let pattern = 0; pattern <= 3; pattern++) {
        const tenths = pattern === 0 || pattern === 2 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const hundredths = pattern === 0 || pattern === 1 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (const tenth of tenths) for (const hundredth of hundredths) for (let thousandth = 1; thousandth <= 9; thousandth++) {
            const draws = [0.62, (pattern + 0.5) / 4];
            if (tenth) draws.push((tenth - 0.5) / 9);
            if (hundredth) draws.push((hundredth - 0.5) / 9);
            draws.push((thousandth - 0.5) / 9);
            add([tenth, hundredth, thousandth], 3, draws, pattern === 0 ? 7695 : pattern === 3 ? 95 : 855);
        }
    }
    return paths;
}
