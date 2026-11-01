import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticPairedPatternProblem, ArithmeticPairedPatternSequence} from '../../../types/problems.ts';
import {ArithmeticPairedPatternsGeneratorConfig, ArithmeticPairedPatternsGeneratorSchema} from './spec.ts';
import {pairedPatternDomain} from './domain.ts';

const sequence = (start: number, increment: number): ArithmeticPairedPatternSequence => ({
    start,
    rule: {kind: 'add-constant', increment},
    terms: Array.from({length: 6}, (_, index) => start + index * increment)
});

export class ArithmeticPairedPatternsGenerator implements ProblemGenerator<
    ArithmeticPairedPatternProblem,
    ArithmeticPairedPatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPairedPatternsGeneratorSchema;

    generate(config: ArithmeticPairedPatternsGeneratorConfig): ProblemStub<ArithmeticPairedPatternProblem> {
        validateConfigFields('arithmetic-paired-patterns', config, ['hasCorrespondence', 'range']);
        const candidates = pairedPatternDomain(config.hasCorrespondence!, config.range!);
        if (!candidates.length) {
            throw new GeneratorValidationError('arithmetic-paired-patterns', 'The selected band has no mathematical patterns.');
        }
        let position = random() * candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
        const selected = candidates.find(candidate => {
            if (position < candidate.weight) return true;
            position -= candidate.weight;
            return false;
        }) ?? candidates.at(-1)!;
        return {data: {
            kind: 'paired-additive-patterns',
            first: sequence(selected.firstStart, selected.firstIncrement),
            second: sequence(selected.secondStart, selected.secondIncrement),
            ...(selected.correspondence && {correspondence: {...selected.correspondence}})
        }};
    }
}
