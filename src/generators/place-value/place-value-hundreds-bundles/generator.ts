import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';
import {PlaceValueHundredsBundlesGeneratorConfig, PlaceValueHundredsBundlesGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {hundredsBundleRows} from './numeric-domain.ts';
export class PlaceValueHundredsBundlesGenerator implements ProblemGenerator<PlaceValueHundredsBundlesProblem, PlaceValueHundredsBundlesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueHundredsBundlesGeneratorSchema;

    generate(config: PlaceValueHundredsBundlesGeneratorConfig): ProblemStub<PlaceValueHundredsBundlesProblem> | null {
        validateConfigFields('place-value-hundreds-bundles', config, ['range', 'requireRegrouping']);
        const range = config.range!;
        if (typeof config.requireRegrouping !== 'boolean' || range.min > range.max) {
            throw new GeneratorValidationError('place-value-hundreds-bundles', 'Expected a regrouping selector and ordered range bounds.');
        }
        const rows = hundredsBundleRows(range, config.requireRegrouping);
        return rows.length ? {data: {...rows[Math.floor(random() * rows.length)]!}} : null;
    }
}
