import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {ArithmeticOpsTriplesGeneratorConfig, ArithmeticOpsTriplesGeneratorSchema} from './spec.ts';

export class ArithmeticOpsTriplesGenerator implements ProblemGenerator<ArithmeticTripleProblem, ArithmeticOpsTriplesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsTriplesGeneratorSchema;

    generate(config: ArithmeticOpsTriplesGeneratorConfig): ProblemStub<ArithmeticTripleProblem> | null {
        validateConfigFields('arithmetic-ops-triples', config, [
            'range',
            'operation',
            'requireZero',
            'requireMultipleOf10',
            'useThreeAddends',
            'useCommutativeLaw',
            'useAssociativeLaw'
        ]);

        const operation = config.operation!;
        if (operation === 'unsupported') return null;

        const requireZero = config.requireZero!;
        const requireMultipleOf10 = config.requireMultipleOf10!;
        const useThreeAddends = config.useThreeAddends!;
        const useCommutativeLaw = config.useCommutativeLaw!;
        const useAssociativeLaw = config.useAssociativeLaw!;
        if (useCommutativeLaw && useAssociativeLaw) return null;
        if (useThreeAddends && operation !== Area.Addition) return null;
        if ((useCommutativeLaw || useAssociativeLaw)
            && operation !== Area.Addition
            && operation !== Area.Multiplication) return null;

        const resolvedRange = config.range!;
        const step = requireMultipleOf10 ? 10 : 1;
        const minMagnitude = Math.ceil(Math.max(1, resolvedRange.min) / step) * step;
        const maxMagnitude = Math.floor(resolvedRange.max / step) * step;
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const randomMagnitude = (min: number, max: number): number | null => {
            const first = Math.ceil(min / step) * step;
            const last = Math.floor(max / step) * step;
            if (first > last) return null;
            const count = Math.floor((last - first) / step) + 1;
            return first + Math.floor(random() * count) * step;
        };
        const randomValue = () => randomMagnitude(minMagnitude, maxMagnitude);

        const boundedSumParts = (count: number, totalLimit: number): number[] | null => {
            if (count * minMagnitude > totalLimit) return null;
            const values: number[] = [];
            let remaining = totalLimit;
            for (let index = 0; index < count; index++) {
                const remainingCount = count - index - 1;
                const value = randomMagnitude(
                    minMagnitude,
                    remaining - remainingCount * minMagnitude
                );
                if (value === null) return null;
                values.push(value);
                remaining -= value;
            }
            return values;
        };

        const boundedProductParts = (): [number, number, number] | null => {
            const first = randomMagnitude(minMagnitude, Math.floor(Math.cbrt(maxMagnitude)));
            if (first === null) return null;
            const second = randomMagnitude(
                minMagnitude,
                Math.floor(Math.sqrt(maxMagnitude / first))
            );
            if (second === null) return null;
            const third = randomMagnitude(minMagnitude, Math.floor(maxMagnitude / (first * second)));
            return third === null ? null : [first, second, third];
        };

        let num1: number;
        let num2: number;
        let num3: number;
        let answer: number;

        if (operation === Area.Addition) {
            const nonZeroParts = boundedSumParts(requireZero ? 2 : 3, maxMagnitude);
            if (!nonZeroParts) return null;
            const operands = requireZero ? [...nonZeroParts, 0] : nonZeroParts;
            if (requireZero) {
                const zeroIndex = Math.floor(random() * 3);
                [operands[zeroIndex], operands[2]] = [operands[2], operands[zeroIndex]];
            }
            [num1, num2, num3] = operands as [number, number, number];
            answer = num1 + num2 + num3;
        } else if (operation === Area.Subtraction) {
            if (requireZero) {
                const subtrahends = boundedSumParts(2, maxMagnitude);
                if (!subtrahends) return null;
                [num2, num3] = subtrahends as [number, number];
                answer = 0;
                num1 = num2 + num3;
            } else {
                const terms = boundedSumParts(3, maxMagnitude);
                if (!terms) return null;
                [num2, num3, answer] = terms as [number, number, number];
                num1 = num2 + num3 + answer;
            }
        } else if (operation === Area.Multiplication) {
            if (requireZero) {
                const first = randomValue();
                const second = randomValue();
                if (first === null || second === null) return null;
                const operands = [first, second, 0];
                const zeroIndex = Math.floor(random() * 3);
                [operands[zeroIndex], operands[2]] = [operands[2], operands[zeroIndex]];
                [num1, num2, num3] = operands as [number, number, number];
                answer = 0;
            } else {
                const factors = boundedProductParts();
                if (!factors) return null;
                [num1, num2, num3] = factors;
                answer = num1 * num2 * num3;
            }
        } else if (operation === Area.Division) {
            if (requireZero) {
                const divisor1 = randomValue();
                const divisor2 = randomValue();
                if (divisor1 === null || divisor2 === null) return null;
                num1 = 0;
                num2 = divisor1;
                num3 = divisor2;
                answer = 0;
            } else {
                const factors = boundedProductParts();
                if (!factors) return null;
                [num2, num3, answer] = factors;
                num1 = answer * num2 * num3;
            }
        } else {
            return null;
        }

        const propertyLaw = useCommutativeLaw
            ? 'commutative' as const
            : useAssociativeLaw
                ? 'associative' as const
                : undefined;

        return {
            tags: [operation],
            data: {
                num1,
                num2,
                num3,
                answer,
                operation: operationNames[operation],
                ...(propertyLaw ? {propertyLaw} : {})
            }
        };
    }
}
