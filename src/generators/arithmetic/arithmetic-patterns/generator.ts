import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticRecurrencePatternProblem} from '../../../types/problems.ts';
import {patternDomain, patternProperty} from './domain.ts';
import {ArithmeticPatternsGeneratorConfig, ArithmeticPatternsGeneratorSchema} from './spec.ts';

export class ArithmeticPatternsGenerator implements ProblemGenerator<ArithmeticRecurrencePatternProblem, ArithmeticPatternsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPatternsGeneratorSchema;

    generate(config: ArithmeticPatternsGeneratorConfig): ProblemStub<ArithmeticRecurrencePatternProblem> | null {
        validateConfigFields('arithmetic-patterns', config, [
            'operation', 'useCommutativeLaw', 'useAssociativeLaw', 'useDistributiveLaw', 'range'
        ]);
        if (config.operation !== 'addition' && config.operation !== 'multiplication') return null;
        const property = patternProperty(!!config.useCommutativeLaw, !!config.useAssociativeLaw, !!config.useDistributiveLaw);
        if (property === undefined) return null;
        const domain = patternDomain(config.operation, property, config.range!);
        return domain.length ? {data: structuredClone(domain[Math.floor(random() * domain.length)]!)} : null;
    }
}
