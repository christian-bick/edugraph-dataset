import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ArithmeticProblem} from "../../../types/problems.ts";
import {Area} from "edugraph-ts";
import {random} from "../../../lib/random.ts";
import {ArithmeticOpsPairsGeneratorConfig, ArithmeticOpsPairsGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ArithmeticOpsPairsGenerator implements ProblemGenerator<ArithmeticProblem, ArithmeticOpsPairsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsPairsGeneratorSchema;

    generate(config: ArithmeticOpsPairsGeneratorConfig): ProblemStub | null {
        validateConfigFields('arithmetic-ops-pairs', config, [
            'range',
            'operation',
            'requireNegative',
            'requireZero',
            'requireMultipleOf10',
            'useThreeAddends',
            'useCommutativeLaw',
            'useAssociativeLaw',
        ]);

        const operation = config.operation;
        const requireNegative = config.requireNegative!;
        const requireZero = config.requireZero!;
        const requireMultipleOf10 = config.requireMultipleOf10!;
        const useThreeAddends = config.useThreeAddends!;
        const useCommutativeLaw = config.useCommutativeLaw!;
        const useAssociativeLaw = config.useAssociativeLaw!;
        if (useCommutativeLaw && useAssociativeLaw) return null;
        if ((useCommutativeLaw || useAssociativeLaw) && operation !== Area.Addition) return null;
        if (useCommutativeLaw && useThreeAddends) return null;
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

        const randomValue = (max = maxMagnitude) => randomMagnitude(minMagnitude, max);
        const randomFactorPair = (): [number, number] | null => {
            const maxFirst = Math.floor(maxMagnitude / minMagnitude);
            const first = randomMagnitude(minMagnitude, maxFirst);
            if (first === null) return null;
            const second = randomMagnitude(minMagnitude, Math.floor(maxMagnitude / first));
            return second === null ? null : [first, second];
        };

        let num1 = 0;
        let num2 = 0;
        let num3: number | undefined;
        let answer = 0;

        if (operation === Area.Addition) {
            if (useThreeAddends || useAssociativeLaw) {
                const nonZeroCount = requireZero ? 2 : 3;
                if (maxMagnitude < nonZeroCount * minMagnitude) return null;

                let remaining = maxMagnitude;
                const addends: number[] = [];
                for (let i = 0; i < nonZeroCount; i++) {
                    const remainingCount = nonZeroCount - i - 1;
                    const magnitude = randomMagnitude(
                        minMagnitude,
                        remaining - remainingCount * minMagnitude
                    );
                    if (magnitude === null) return null;
                    addends.push(requireNegative ? -magnitude : magnitude);
                    remaining -= magnitude;
                }
                if (requireZero) {
                    const zeroIndex = Math.floor(random() * 3);
                    addends.splice(zeroIndex, 0, 0);
                }

                [num1, num2, num3] = addends as [number, number, number];
                answer = num1 + num2 + num3;
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
            if (useThreeAddends) return null;
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
            if (useThreeAddends) return null;
            if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = 0;
                num2 = requireNegative ? -magnitude : magnitude;
            } else {
                const factors = randomFactorPair();
                if (!factors) return null;
                num1 = requireNegative ? -factors[0] : factors[0];
                num2 = factors[1];
            }
            answer = num1 * num2;
        } else if (operation === Area.Division) {
            if (useThreeAddends) return null;
            if (requireZero) {
                const magnitude = randomValue();
                if (magnitude === null) return null;
                num1 = 0;
                num2 = requireNegative ? -magnitude : magnitude;
                answer = 0;
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

        const opMap: Record<string, string> = {
            [Area.Addition]: 'addition',
            [Area.Subtraction]: 'subtraction',
            [Area.Multiplication]: 'multiplication',
            [Area.Division]: 'division'
        };

        const strOp = opMap[operation];

        const normalizeZero = (val: number) => val === 0 ? 0 : val;
        num1 = normalizeZero(num1);
        num2 = normalizeZero(num2);
        answer = normalizeZero(answer);

        return {
            tags: [operation],
            data: {
                num1,
                num2,
                answer,
                operation: strOp,
                ...(num3 === undefined ? {} : {num3}),
                ...(useCommutativeLaw ? {propertyLaw: 'commutative' as const} : {}),
                ...(useAssociativeLaw ? {propertyLaw: 'associative' as const} : {})
            }
        };
    }
}
