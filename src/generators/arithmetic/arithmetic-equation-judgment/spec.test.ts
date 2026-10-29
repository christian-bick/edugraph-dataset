import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';
import {ArithmeticEquationJudgmentGeneratorSchema, spec} from './spec.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveEquationClaim} from '../../../visuals/views/operations/operations-equation-judgment/helpers.ts';
import {spec as viewSpec} from '../../../visuals/views/operations/operations-equation-judgment/spec.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';

describe('ArithmeticEquationJudgmentGenerator spec integration', () => {
    const generator = new ArithmeticEquationJudgmentGenerator();

    it('resolves both supported operations and range labels', () => {
        for (const operation of [Area.Addition, Area.Subtraction] as const) {
            const stub = generateWithLabels(generator, [
                operation,
                Ability.CorrectnessEvaluation,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.operation).toBe(operation === Area.Addition ? 'addition' : 'subtraction');
            expect(stub!.labels).toEqual(expect.arrayContaining([operation, Scope.NumbersSmaller20]));
        }
    });

    it('proves every supported positive addition and either judgment have no zero', () => {
        // The largest supported range ends at 100. Every smaller range is a subset.
        for (let num1 = 1; num1 < 100; num1++) {
            for (let num2 = 1; num1 + num2 <= 100; num2++) {
                const data = {num1, num2, answer: num1 + num2, operation: 'addition' as const};
                for (const seed of [0, 1]) {
                    expect(resolveEquationClaim(data, seed).claimedAnswer).toBeGreaterThan(0);
                }
            }
        }
        const positive = generateWithLabels(generator, [Area.Addition, Scope.NumbersSmaller20]);
        expect(positive!.labels).toContain(Scope.NumbersWithoutZero);
        for (const labels of [[Area.Subtraction], [Area.Addition, Scope.NumbersWithZero]]) {
            const stub = generateWithLabels(generator, [...labels, Scope.NumbersSmaller20]);
            expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
        }
    });

    it('preserves direct configurations, payloads and random continuation', () => {
        for (const operation of [Area.Addition, Area.Subtraction]) {
            for (const zero of [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]) {
                for (const seed of [0, 1, 42]) {
                    const draws = [{...spec, inferredLabels: undefined}, spec].map(owner => {
                        setSeed(seed);
                        const resolved = extractConfig(generator.schema,
                            [operation, Scope.NumbersSmaller20, ...zero], {spec: owner, owner: 'generator'});
                        const stub = generator.generate(resolved.config);
                        return {config: resolved.config, stub, randomState: getRandomState()};
                    });
                    expect(draws[1]).toEqual(draws[0]);
                }
            }
        }
    });

    it('annotates and replays the existing planned addition target', () => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: ArithmeticEquationJudgmentGeneratorSchema, spec};
        const consumer = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec};
        const labels = [Area.Addition, Scope.NumbersSmaller20, ...viewSpec.generalLabels];
        const result = planModelCompatibility({id: 'positive-addition-judgment', labels}, model, consumer);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error('Expected the original addition target to remain admitted.');
        const input = {generator, generatorSpec: spec, viewSpec, viewSchema: {}, plan: result.plan,
            sampleKey: 'positive-addition-judgment#arithmetic-equation-judgment#operations-equation-judgment#train#question#inst:0',
            attempt: 1, seed: 42};
        const draw = generatePlannedDraw(input);
        const state = getRandomState();
        expect(draw.labels).toContain(Scope.NumbersWithoutZero);
        expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        expect(getRandomState()).toBe(state);
    });
});
