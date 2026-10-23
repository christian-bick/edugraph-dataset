import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem} from '../../../types/problems.ts';
import {buildNumericalDataProblem} from '../numerical-data-helpers.ts';
import {isNumericalRelationSet, numericalDataInput, numericalDataInputCount} from '../numerical-data-inputs.ts';
import {NumericalDataGeneratorSchema, type NumericalDataGeneratorConfig} from './spec.ts';

export class NumericalDataGenerator implements ProblemGenerator<NumericalDataProblem, NumericalDataGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = NumericalDataGeneratorSchema;

    generate(config: NumericalDataGeneratorConfig): ProblemStub<NumericalDataProblem> {
        validateConfigFields('numerical-data', config, ['relations']);
        if (!isNumericalRelationSet(config.relations)) throw new GeneratorValidationError('numerical-data', 'Choose one supported mathematical relation set.');
        // One draw changes actual source observations and their measurement frame.
        // Every statistic and requested theorem is then constructed exactly.
        const selection = Math.floor(random() * numericalDataInputCount(config.relations));
        return {data: buildNumericalDataProblem(numericalDataInput(config.relations, selection))};
    }
}

export default new NumericalDataGenerator();
