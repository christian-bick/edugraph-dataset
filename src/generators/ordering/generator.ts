import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {OrderingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {OrderingGeneratorConfig, OrderingGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class OrderingGenerator implements ProblemGenerator<OrderingProblem, OrderingGeneratorConfig> {
    type: AbstractProblem['type'] = 'ordering';
    schema = OrderingGeneratorSchema;

    generate(config: OrderingGeneratorConfig): ProblemStub | null {
        validateConfigFields('ordering', config, ['range', 'requireNegative', 'requireZero']);
        const resolvedRange = config.range!;
        const minMagnitude = resolvedRange.min >= 100
            ? Math.max(101, Math.ceil(resolvedRange.min))
            : Math.max(1, Math.ceil(resolvedRange.min));
        const maxMagnitude = Math.min(120, Math.floor(resolvedRange.max));
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const magnitudes = Array.from(
            {length: maxMagnitude - minMagnitude + 1},
            (_, index) => minMagnitude + index
        );
        const pool = [
            ...magnitudes,
            ...(config.requireNegative ? magnitudes.map(value => -value) : []),
            ...(config.requireZero ? [0] : [])
        ];
        if (pool.length < 5) return null;

        const required = new Set<number>();
        if (config.requireZero) required.add(0);
        if (config.requireNegative) {
            const magnitude = magnitudes[Math.floor(random() * magnitudes.length)];
            required.add(-magnitude);
        }

        const remaining = shuffleArray(pool.filter(value => !required.has(value)));
        const selectedNumbers = shuffleArray([
            ...required,
            ...remaining.slice(0, 5 - required.size)
        ]);

        return {
            data: {
                numbers: selectedNumbers
            }
        };
    }
}
