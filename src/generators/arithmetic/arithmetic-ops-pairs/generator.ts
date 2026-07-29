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
            'invertProcedure'
        ]);

        const operation = config.operation;
        const requireNegative = config.requireNegative!;
        const requireZero = config.requireZero!;
        const resolvedRange = config.range!;
        const minMagnitude = Math.max(1, Math.ceil(resolvedRange.min));
        const maxMagnitude = Math.floor(resolvedRange.max);
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const randomInteger = (min: number, max: number): number | null => {
            if (min > max) return null;
            return Math.floor(random() * (max - min + 1)) + min;
        };

        const randomMagnitude = (max = maxMagnitude) => randomInteger(minMagnitude, max);
        const randomFactorPair = (): [number, number] | null => {
            const maxFirst = Math.floor(maxMagnitude / minMagnitude);
            const first = randomInteger(minMagnitude, maxFirst);
            if (first === null) return null;
            const second = randomInteger(minMagnitude, Math.floor(maxMagnitude / first));
            return second === null ? null : [first, second];
        };

        let num1 = 0;
        let num2 = 0;
        let answer = 0;

        if (operation === Area.Addition) {
            if (requireZero) {
                const magnitude = randomMagnitude();
                if (magnitude === null) return null;
                num1 = requireNegative ? -magnitude : 0;
                num2 = magnitude;
                answer = requireNegative ? 0 : magnitude;
            } else if (requireNegative) {
                const magnitude = randomMagnitude(Math.floor(maxMagnitude / 2));
                if (magnitude === null) return null;
                num1 = -magnitude;
                num2 = -magnitude;
                answer = -2 * magnitude;
            } else {
                const first = randomInteger(minMagnitude, maxMagnitude - minMagnitude);
                if (first === null) return null;
                const second = randomInteger(minMagnitude, maxMagnitude - first);
                if (second === null) return null;
                num1 = first;
                num2 = second;
                answer = num1 + num2;
            }
        } else if (operation === Area.Subtraction) {
            if (requireZero) {
                const magnitude = randomMagnitude();
                if (magnitude === null) return null;
                num1 = requireNegative ? 0 : magnitude;
                num2 = magnitude;
                answer = requireNegative ? -magnitude : 0;
            } else if (requireNegative) {
                const magnitude = randomMagnitude(Math.floor(maxMagnitude / 2));
                if (magnitude === null) return null;
                num1 = magnitude;
                num2 = 2 * magnitude;
                answer = -magnitude;
            } else {
                const subtrahend = randomInteger(minMagnitude, maxMagnitude - minMagnitude);
                if (subtrahend === null) return null;
                const difference = randomInteger(minMagnitude, maxMagnitude - subtrahend);
                if (difference === null) return null;
                num2 = subtrahend;
                answer = difference;
                num1 = num2 + answer;
            }
        } else if (operation === Area.Multiplication) {
            if (requireZero) {
                const magnitude = randomMagnitude();
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
            if (requireZero) {
                const magnitude = randomMagnitude();
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

        const blankPart = config.invertProcedure ? 'num2' : 'solution';

        return {
            data: {
                num1,
                num2,
                answer,
                operation: strOp,
                ...(blankPart ? { blankPart } : {})
            }
        };
    }
}
