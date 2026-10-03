import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {DecimalWritingGenerator} from './generator.ts';

const generator = new DecimalWritingGenerator();

const scaleOf = (part: DecimalWritingProblem['fractionalPart']): number =>
    part.precision === 'tenths' ? 1 : part.precision === 'hundredths' ? 2 : 3;

function verifyExactValue(data: DecimalWritingProblem): void {
    const {wholePart, fractionalPart: part} = data;
    const scale = scaleOf(part);
    expect(data.kind).toBe('decimal-writing');
    expect(data.base).toBe(10);
    expect(Number.isInteger(wholePart)).toBe(true);
    expect(wholePart).toBeGreaterThanOrEqual(0);
    expect(wholePart).toBeLessThanOrEqual(9);
    expect(part.denominator).toBe(10 ** scale);
    expect(part.digits).toHaveLength(3);
    expect(part.digits.every(digit => Number.isInteger(digit) && digit >= 0 && digit <= 9))
        .toBe(true);
    expect(part.digits[scale - 1]).toBeGreaterThan(0);
    expect(part.digits.slice(scale)).toEqual(Array(3 - scale).fill(0));
    expect(part.numerator).toBe(Number(part.digits.slice(0, scale).join('')));
    expect(data.valueInThousandths).toBe(
        wholePart * 1000 + part.numerator * 10 ** (3 - scale)
    );
    expect(data.canonicalNumeral).toBe(
        `${wholePart}.${part.digits.slice(0, scale).join('')}`
    );
    expect(data.canonicalNumeral.at(-1)).not.toBe('0');
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('requestedName');
    expect(data).not.toHaveProperty('blank');
}

describe('DecimalWritingGenerator', () => {
    it('requires a supported notation family', () => {
        expect(() => generator.generate({})).toThrow('notationFamily');
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({notationFamily: 'invalid'})).toThrow(
            'Expected DecimalNotation or NumberNameNotation'
        );
    });

    it.each([Area.DecimalNotation, Area.NumberNameNotation])(
        'samples exact decimals through thousandths under %s', notationFamily => {
            const precisions = new Set<string>();
            let interiorZeroCases = 0;
            let zeroWholeCases = 0;
            for (let seed = 0; seed < 240; seed++) {
                setSeed(seed);
                const {data} = generator.generate({notationFamily});
                verifyExactValue(data);
                precisions.add(data.fractionalPart.precision);
                if (data.fractionalPart.precision === 'thousandths'
                    && data.fractionalPart.digits[0] === 0
                    && data.fractionalPart.digits[1] === 0) interiorZeroCases++;
                if (data.wholePart === 0) zeroWholeCases++;
            }
            expect(precisions).toEqual(new Set(['tenths', 'hundredths', 'thousandths']));
            expect(interiorZeroCases).toBeGreaterThan(0);
            expect(zeroWholeCases).toBeGreaterThan(0);
        }
    );

    it('replays the same decimal under the same seed', () => {
        setSeed('decimal-writing-replay');
        const first = generator.generate({notationFamily: Area.DecimalNotation});
        setSeed('decimal-writing-replay');
        expect(generator.generate({notationFamily: Area.DecimalNotation})).toEqual(first);
    });

    it('can represent five and eight thousandths with both zero placeholders', () => {
        let example: DecimalWritingProblem | undefined;
        for (let seed = 0; seed < 10000 && !example; seed++) {
            setSeed(seed);
            const {data} = generator.generate({notationFamily: Area.NumberNameNotation});
            if (data.canonicalNumeral === '5.008') example = data;
        }
        expect(example).toEqual({
            kind: 'decimal-writing',
            base: 10,
            wholePart: 5,
            valueInThousandths: 5008,
            canonicalNumeral: '5.008',
            fractionalPart: {
                precision: 'thousandths',
                digits: [0, 0, 8],
                numerator: 8,
                denominator: 1000
            }
        });
    });
});
