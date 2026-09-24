import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';
import {PlaceValueHundredsBundlesGeneratorConfig, PlaceValueHundredsBundlesGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
export class PlaceValueHundredsBundlesGenerator implements ProblemGenerator<PlaceValueHundredsBundlesProblem, PlaceValueHundredsBundlesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueHundredsBundlesGeneratorSchema;

    generate(config: PlaceValueHundredsBundlesGeneratorConfig): ProblemStub<PlaceValueHundredsBundlesProblem> | null {
        validateConfigFields('place-value-hundreds-bundles', config, ['range']);
        const range = config.range!;
        if (range.min > range.max) {
            throw new GeneratorValidationError('place-value-hundreds-bundles', 'Invalid range bounds: min exceeds max.');
        }
        const minHundreds = Math.max(1, Math.ceil(range.min / 100));
        const maxHundreds = Math.min(9, Math.floor(range.max / 100));
        if (minHundreds > maxHundreds) return null;

        const hundreds = minHundreds + Math.floor(random() * (maxHundreds - minHundreds + 1));
        const showTenTens = range.max <= 120;
        return {
            data: {
                hundreds,
                tens: showTenTens ? 10 : 0,
                ones: 0,
                target: hundreds * 100
            }
        };

    }
}
