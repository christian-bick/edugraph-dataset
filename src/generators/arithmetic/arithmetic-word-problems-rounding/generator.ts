import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemRounding} from '../../../types/problems.ts';
import {ArithmeticWordProblemsRoundingGeneratorConfig, ArithmeticWordProblemsRoundingGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {buildRounding} from '../word-problem-evidence.ts';
import {generateRoundingProposal} from './proposal-domain.ts';
import {random} from '../../../lib/random.ts';
import {canonicalProposalInterval, roundingDomain, selectRoundingCore} from './domain.ts';
export class ArithmeticWordProblemsRoundingGenerator implements ProblemGenerator<ArithmeticWordProblemRounding, ArithmeticWordProblemsRoundingGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsRoundingGeneratorSchema;

    generate(config: ArithmeticWordProblemsRoundingGeneratorConfig): ProblemStub<ArithmeticWordProblemRounding> | null {
        validateConfigFields('arithmetic-word-problems-rounding', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        if (!namedOperations.every(Boolean)) throw new GeneratorValidationError('arithmetic-word-problems-rounding', 'Select two supported operations.');
        const range = config.range!, domain = roundingDomain(namedOperations, range);
        const row = selectRoundingCore(domain, random());
        const data = {...buildRounding({num1: row.a, num2: row.b, num3: row.c, intermediate: row.intermediate, answer: row.answer}, namedOperations),
            numberDomain: {min: Math.max(1, range.min), max: range.max}};
        const proposal = generateRoundingProposal(data, canonicalProposalInterval(row, range)!);
        return proposal ? {data: {...data, proposal}} : null;
    }
}
