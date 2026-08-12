import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueBundlesProblem} from '../../../types/problems.ts';
import {PlaceValueBundlesGeneratorConfig, PlaceValueBundlesGeneratorSchema} from './spec.ts';

export class PlaceValueBundlesGenerator implements ProblemGenerator<PlaceValueBundlesProblem, PlaceValueBundlesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueBundlesGeneratorSchema;

    generate(config: PlaceValueBundlesGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-bundles', config, ['range', 'useHundreds']);
        const range = config.range!;

        if (range.min > range.max) {
            throw new GeneratorValidationError(
                'place-value-bundles',
                `Invalid range bounds: min (${range.min}) exceeds max (${range.max}).`
            );
        }

        if (config.useHundreds) {
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

        const minTens = Math.max(1, Math.ceil(range.min / 10));
        const maxTens = Math.min(9, Math.floor(range.max / 10));
        if (minTens > maxTens) return null;

        const tens = minTens + Math.floor(random() * (maxTens - minTens + 1));

        return {
            data: {
                tens,
                ones: 0,
                target: tens * 10
            }
        };
    }
}
