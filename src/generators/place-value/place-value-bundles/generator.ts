import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueBundlesProblem} from '../../../types/problems.ts';
import {PlaceValueBundlesGeneratorConfig, PlaceValueBundlesGeneratorSchema} from './spec.ts';

export class PlaceValueBundlesGenerator implements ProblemGenerator<PlaceValueBundlesProblem, PlaceValueBundlesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueBundlesGeneratorSchema;

    generate(config: PlaceValueBundlesGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-bundles', config, ['useMultipleTens', 'range']);
        const range = config.range!;
        const useMultipleTens = config.useMultipleTens!;

        if (range.min > range.max) {
            throw new GeneratorValidationError(
                'place-value-bundles',
                `Invalid range bounds: min (${range.min}) exceeds max (${range.max}).`
            );
        }

        const minTens = Math.max(1, Math.ceil(range.min / 10));
        const maxTens = Math.min(9, Math.floor(range.max / 10));
        if (minTens > maxTens) return null;

        const tens = useMultipleTens
            ? minTens + Math.floor(random() * (maxTens - minTens + 1))
            : 1;
        if (tens < minTens || tens > maxTens) return null;

        return {
            data: {
                tens,
                ones: 0,
                target: tens * 10
            }
        };
    }
}
