import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {arithmeticOperations, operationNames} from '../helpers.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {estimationQuantities, hasCanonicalEstimationProfile} from './canonical-domain.ts';

const apply = (a: number, b: number, operation: string) => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;

describe('ArithmeticEstimationGenerator canonical evidence', () => {
    const generator = new ArithmeticEstimationGenerator();
    it('generates every feasible operation/zero/range cell with coherent mathematics and exact seed replay', () => {
        let cells = 0;
        for (const operation of arithmeticOperations) for (const zeroPresence of [false, true]) {
            for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 1000)) {
                if (!hasCanonicalEstimationProfile(operationNames[operation], zeroPresence, range)) continue;
                cells++;
                for (const seed of [0, 17]) {
                    setSeed(seed);
                    const result = generator.generate({operation, range, zeroPresence})!;
                    const state = getRandomState(), data = result.data;
                    setSeed(seed);
                    expect(generator.generate({operation, range, zeroPresence})).toEqual(result);
                    expect(getRandomState()).toBe(state);
                    expect(data.exactAnswer).toBe(apply(data.num1, data.num2, data.operation));
                    expect(data.roundedNum1).toBe(Math.round(data.num1 / 10) * 10);
                    expect(data.roundedNum2).toBe(Math.round(data.num2 / 10) * 10);
                    expect(data.estimatedAnswer).toBe(apply(data.roundedNum1, data.roundedNum2, data.operation));
                    expect(data.roundingPlace).toBe(10);
                    expect(hasCanonicalRangeWitness(estimationQuantities(data), range)).toBe(true);
                    expect(estimationQuantities(data).includes(0)).toBe(zeroPresence);
                    expect(estimationQuantities(data).every(value => value >= data.numberDomain.min && value <= data.numberDomain.max)).toBe(true);
                }
            }
        }
        expect(cells).toBe(47);
    }, 60000);
    it('rejects incomplete or noncanonical configurations and terminates empty mathematical profiles', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({operation: Area.Addition})).toThrow();
        expect(() => generator.generate({operation: Area.Addition, range: {min: 0, max: 1000}, zeroPresence: false} as never)).toThrow();
        expect(() => generator.generate({operation: Area.Addition, range: createCanonicalNumericRange(1000), zeroPresence: 'zero'} as never)).toThrow();
        expect(generator.generate({operation: Area.Multiplication, range: createCanonicalNumericRange(100), zeroPresence: false})).toBeNull();
        expect(() => generator.generate({operation: 'unsupported', range: createCanonicalNumericRange(1000), zeroPresence: false} as never)).toThrow();
    });
});
