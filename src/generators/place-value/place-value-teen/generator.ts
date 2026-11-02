import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {PlaceValueTeenProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {PlaceValueTeenGeneratorConfig, PlaceValueTeenGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";
import {teenRowsForRange} from './numeric-domain.ts';

export class PlaceValueTeenGenerator implements ProblemGenerator<PlaceValueTeenProblem, PlaceValueTeenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueTeenGeneratorSchema;

    generate(config: PlaceValueTeenGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-teen', config, ['range']);
        const rows = teenRowsForRange(config.range!);
        if (!rows.length) throw new GeneratorValidationError('place-value-teen', 'Choose a supported canonical teen range.');
        return {data: {...rows[Math.floor(random() * rows.length)]!}};
    }
}
