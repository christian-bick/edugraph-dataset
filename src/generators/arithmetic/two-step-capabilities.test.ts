import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig} from '../../lib/utils.ts';
import {resolveTwoStepOperations} from './helpers.ts';
import {TwoStepExtendedGeneratorSchema} from './two-step-capabilities.ts';
import {ArithmeticWordProblemsInterpretedRemainderGenerator} from './arithmetic-word-problems-interpreted-remainder/generator.ts';

describe('extended two-step family contract preservation', () => {
    it('preserves the exact former shared schema, direct configurations and entropy for Grade4 siblings', () => {
        const original = {
            operations: [[Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division], resolveTwoStepOperations],
            range: [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]), resolveRangeFromLabels]
        } as const;
        expect(TwoStepExtendedGeneratorSchema).toEqual(original);
        for (const constructor of [ArithmeticWordProblemsInterpretedRemainderGenerator]) {
            const generator = new constructor();
            const previousSchema = generator instanceof ArithmeticWordProblemsInterpretedRemainderGenerator ? {range: original.range} : original;
            for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
                for (const range of [Scope.NumbersSmaller100, Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000]) {
                    const labels = [operation, range];
                    for (const seed of [0, 17]) {
                        const controls = [previousSchema, generator.schema].map(schema => {
                            setSeed(seed);
                            const config = extractConfig(schema, labels);
                            const state = getRandomState();
                            const data = generator.generate(config.config as never);
                            return {config, state, data, continuation: getRandomState()};
                        });
                        expect(controls[1]).toEqual(controls[0]);
                    }
                }
            }
        }
    });
});
