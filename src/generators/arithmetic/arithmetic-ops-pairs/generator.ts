import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticPairProblem} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {ArithmeticOpsPairsGeneratorConfig, ArithmeticOpsPairsGeneratorSchema} from './spec.ts';
import {sampleBoundedOperandWidthPair, sampleOperandWidthPair} from './width-sampling.ts';
import {sampleUnboundedOperandWidthPair} from './unbounded-width-sampling.ts';

export class ArithmeticOpsPairsGenerator implements ProblemGenerator<ArithmeticPairProblem, ArithmeticOpsPairsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsPairsGeneratorSchema;

    generate(config: ArithmeticOpsPairsGeneratorConfig): ProblemStub<ArithmeticPairProblem> | null {
        validateConfigFields('arithmetic-ops-pairs', config, [
            'range',
            'operation',
            'requireNegative',
            'requireZero',
            'requireMultipleOf10',
            'requireEqualAddends',
            'requireEvenResult',
            'largestOperandDigits'
        ]);

        const operation = config.operation!;
        if (operation === 'unsupported') return null;

        const requireNegative = config.requireNegative!;
        const requireZero = config.requireZero!;
        const requireMultipleOf10 = config.requireMultipleOf10!;
        const resolvedRange = config.range!;
        const step = requireMultipleOf10 ? 10 : 1;
        const minMagnitude = Math.ceil(Math.max(1, resolvedRange.min) / step) * step;
        const maxMagnitude = Math.floor(resolvedRange.max / step) * step;
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const digits = config.largestOperandDigits!;
        if (![0, 1, 2, 3, 4, 'multiple'].includes(digits)) return null;
        const existingSingleDigitDomain = digits === 1 && maxMagnitude <= 5;
        const widthProfile = digits !== 0 && !existingSingleDigitDomain;
        const exactDigits = typeof digits === 'number' ? digits : 0;
        const unboundedProfile = widthProfile && maxMagnitude === Number.MAX_SAFE_INTEGER
            && (digits === 1 || digits === 'multiple');
        if (widthProfile && !unboundedProfile
            && (digits === 'multiple' || 10 ** (exactDigits - 1) > maxMagnitude - (operation === Area.Addition ? 1 : 0))) return null;
        const additive = operation === Area.Addition || operation === Area.Subtraction;
        if (widthProfile && ((!unboundedProfile && !(additive ? [20, 100, 1000].includes(maxMagnitude) : maxMagnitude === 100))
            || config.requireEqualAddends && operation !== Area.Addition
            || unboundedProfile && config.requireEqualAddends
            || requireNegative || requireZero || requireMultipleOf10
            || minMagnitude !== 1)) return null;

        const randomMagnitude = (min: number, max: number): number | null => {
            const first = Math.ceil(min / step) * step;
            const last = Math.floor(max / step) * step;
            if (first > last) return null;
            const count = Math.floor((last - first) / step) + 1;
            return first + Math.floor(random() * count) * step;
        };

        const randomValue = (max = maxMagnitude) => randomMagnitude(minMagnitude, max);
        const randomInteger = (min: number, max: number): number | null => {
            if (min > max) return null;
            return min + Math.floor(random() * (max - min + 1));
        };
        const randomFactorPair = (): [number, number] | null => {
            const maxFirst = Math.floor(maxMagnitude / minMagnitude);
            const first = randomMagnitude(minMagnitude, maxFirst);
            if (first === null) return null;
            const second = randomMagnitude(minMagnitude, Math.floor(maxMagnitude / first));
            return second === null ? null : [first, second];
        };

        let num1 = 0;
        let num2 = 0;
        let answer = 0;

        if (operation === Area.Addition) {
            if (config.requireEqualAddends) {
                if (requireNegative || requireZero) return null;
                const addend = randomMagnitude(
                    widthProfile ? 10 ** (exactDigits - 1) : minMagnitude,
                    widthProfile ? Math.min(10 ** exactDigits - 1, Math.floor(maxMagnitude / 2)) : Math.floor(maxMagnitude / 2));
                if (addend === null) return null;
                num1 = addend;
                num2 = addend;
                answer = addend * 2;
            } else if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = requireNegative ? -magnitude : 0;
                num2 = magnitude;
                answer = requireNegative ? 0 : magnitude;
            } else if (requireNegative) {
                const magnitude = randomValue(Math.floor(maxMagnitude / 2));
                if (magnitude === null) return null;
                num1 = -magnitude;
                num2 = -magnitude;
                answer = -2 * magnitude;
            } else if (widthProfile) {
                const pair = unboundedProfile ? sampleUnboundedOperandWidthPair('addition', digits === 1 ? 'single' : 'multiple')
                    : maxMagnitude === 20 ? sampleOperandWidthPair('addition', digits as 1 | 2)
                        : sampleBoundedOperandWidthPair('addition', exactDigits, maxMagnitude);
                if (!pair) return null;
                [num1, num2] = pair;
                answer = num1 + num2;
            } else {
                const first = randomMagnitude(minMagnitude, maxMagnitude - minMagnitude);
                if (first === null) return null;
                const second = randomMagnitude(minMagnitude, maxMagnitude - first);
                if (second === null) return null;
                num1 = first;
                num2 = second;
                answer = num1 + num2;
            }
        } else if (operation === Area.Subtraction) {
            if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = requireNegative ? 0 : magnitude;
                num2 = magnitude;
                answer = requireNegative ? -magnitude : 0;
            } else if (requireNegative) {
                const magnitude = randomValue(Math.floor(maxMagnitude / 2));
                if (magnitude === null) return null;
                num1 = magnitude;
                num2 = 2 * magnitude;
                answer = -magnitude;
            } else if (widthProfile) {
                const pair = unboundedProfile ? sampleUnboundedOperandWidthPair('subtraction', digits === 1 ? 'single' : 'multiple')
                    : maxMagnitude === 20 ? sampleOperandWidthPair('subtraction', digits as 1 | 2)
                        : sampleBoundedOperandWidthPair('subtraction', exactDigits, maxMagnitude);
                if (!pair) return null;
                [num1, num2] = pair;
                answer = num1 - num2;
            } else {
                const subtrahend = randomMagnitude(minMagnitude, maxMagnitude - minMagnitude);
                if (subtrahend === null) return null;
                const difference = randomMagnitude(minMagnitude, maxMagnitude - subtrahend);
                if (difference === null) return null;
                num2 = subtrahend;
                answer = difference;
                num1 = num2 + answer;
            }
        } else if (operation === Area.Multiplication) {
            if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = 0;
                num2 = requireNegative ? -magnitude : magnitude;
            } else if (requireMultipleOf10) {
                const minimumFactor = Math.max(1, Math.ceil(resolvedRange.min));
                const candidates: Array<[number, number]> = [];
                for (let oneDigit = minimumFactor; oneDigit <= Math.min(9, maxMagnitude); oneDigit++) {
                    for (let multiple = 10; multiple <= Math.min(90, maxMagnitude); multiple += 10) {
                        const product = oneDigit * multiple;
                        if (product >= resolvedRange.min && product <= maxMagnitude) {
                            candidates.push([oneDigit, multiple]);
                        }
                    }
                }
                const candidateIndex = randomInteger(0, candidates.length - 1);
                if (candidateIndex === null) return null;
                const [oneDigit, multiple] = candidates[candidateIndex];
                const signedOneDigit = requireNegative ? -oneDigit : oneDigit;
                if (random() < 0.5) {
                    num1 = signedOneDigit;
                    num2 = multiple;
                } else {
                    num1 = multiple;
                    num2 = signedOneDigit;
                }
            } else if (widthProfile) {
                const pair = unboundedProfile ? sampleUnboundedOperandWidthPair('multiplication', digits === 1 ? 'single' : 'multiple')
                    : sampleBoundedOperandWidthPair('multiplication', exactDigits, maxMagnitude);
                if (!pair) return null;
                [num1, num2] = pair;
            } else {
                const factors = randomFactorPair();
                if (!factors) return null;
                num1 = requireNegative ? -factors[0] : factors[0];
                num2 = factors[1];
            }
            answer = num1 * num2;
        } else if (operation === Area.Division) {
            if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = 0;
                num2 = requireNegative ? -magnitude : magnitude;
                answer = 0;
            } else if (widthProfile) {
                const pair = unboundedProfile ? sampleUnboundedOperandWidthPair('division', digits === 1 ? 'single' : 'multiple')
                    : sampleBoundedOperandWidthPair('division', exactDigits, maxMagnitude);
                if (!pair) return null;
                [num1, num2] = pair;
                answer = num1 / num2;
            } else {
                const factors = randomFactorPair();
                if (!factors) return null;
                num2 = factors[0];
                answer = requireNegative ? -factors[1] : factors[1];
                num1 = answer * num2;
            }
        } else {
            return null;
        }

        if (config.requireEvenResult && answer % 2 !== 0) return null;

        const normalizeZero = (value: number) => value === 0 ? 0 : value;
        return {
            data: {
                num1: normalizeZero(num1),
                num2: normalizeZero(num2),
                answer: normalizeZero(answer),
                operation: operationNames[operation]
            }
        };
    }
}
