import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {IntegerFlexibleStrategyProblem} from '../../../types/problems.ts';
import {additionMakeTen, additionNearDoubles, additionCompensation, subtractionCompensation, subtractionMakeTen, subtractionThinkAddition, strategyBounds} from '../integer-strategy-evidence.ts';
import {IntegerAddSubtractStrategiesGeneratorConfig, IntegerAddSubtractStrategiesGeneratorSchema, spec} from './spec.ts';

const builders = {
    'addition-make-ten': additionMakeTen,
    'addition-near-doubles': additionNearDoubles,
    'addition-compensation-single': (bounds: NonNullable<ReturnType<typeof strategyBounds>>) =>
        additionCompensation({...bounds, largestOperandWidth: 'single'}),
    'addition-compensation-multiple': (bounds: NonNullable<ReturnType<typeof strategyBounds>>) =>
        additionCompensation({...bounds, largestOperandWidth: 'multiple'}),
    'subtraction-compensation-single': (bounds: NonNullable<ReturnType<typeof strategyBounds>>) =>
        subtractionCompensation({...bounds, largestOperandWidth: 'single'}),
    'subtraction-compensation-multiple': (bounds: NonNullable<ReturnType<typeof strategyBounds>>) =>
        subtractionCompensation({...bounds, largestOperandWidth: 'multiple'}),
    'subtraction-make-ten': subtractionMakeTen,
    'subtraction-think-addition': subtractionThinkAddition
};

export class IntegerAddSubtractStrategiesGenerator implements ProblemGenerator<
    IntegerFlexibleStrategyProblem,
    IntegerAddSubtractStrategiesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerAddSubtractStrategiesGeneratorSchema;
    readonly spec = spec;

    generate(
        config: IntegerAddSubtractStrategiesGeneratorConfig
    ): ProblemStub<IntegerFlexibleStrategyProblem> | null {
        validateConfigFields('integer-add-subtract-strategies', config, ['strategy', 'range']);

        const strategy = config.strategy!;
        if (!Object.hasOwn(builders, strategy)) {
            throw new GeneratorValidationError(
                'integer-add-subtract-strategies',
                `Unsupported strategy "${strategy}".`
            );
        }

        const bounds = strategyBounds(config.range!);
        if (!bounds) return null;

        const problem = builders[strategy](bounds);
        return problem ? {data: problem} : null;
    }
}
