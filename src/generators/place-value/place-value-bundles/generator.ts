import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueTensBundlesProblem} from '../../../types/problems.ts';
import {PlaceValueBundlesGeneratorConfig, PlaceValueBundlesGeneratorSchema} from './spec.ts';
import {tensRowsForRange} from './numeric-domain.ts';

export class PlaceValueBundlesGenerator implements ProblemGenerator<PlaceValueTensBundlesProblem, PlaceValueBundlesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueBundlesGeneratorSchema;

    generate(config: PlaceValueBundlesGeneratorConfig): ProblemStub<PlaceValueTensBundlesProblem> | null {
        validateConfigFields('place-value-bundles', config, ['range']);
        const rows = tensRowsForRange(config.range!);
        if (!rows.length) throw new GeneratorValidationError('place-value-bundles', 'Choose a supported canonical tens-bundle range.');
        return {data: {...rows[Math.floor(random() * rows.length)]!}};
    }
}
