import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {MeasurementCompareProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {MeasurementCompareGeneratorConfig, MeasurementCompareGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class MeasurementCompareGenerator implements ProblemGenerator<MeasurementCompareProblem, MeasurementCompareGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementCompareGeneratorSchema;

    generate(config: MeasurementCompareGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement-compare', config, ['attribute', 'relation']);
        const attributeLabel = config.attribute;
        const relationLabel = config.relation;

        if (attributeLabel !== Scope.LengthMeasurement && attributeLabel !== Scope.WeightMeasurement) return null;
        if (relationLabel !== Scope.Greater && relationLabel !== Scope.Less) return null;

        const attribute: MeasurementCompareProblem['attribute'] =
            attributeLabel === Scope.LengthMeasurement ? 'length' : 'weight';
        const relation: MeasurementCompareProblem['relation'] =
            relationLabel === Scope.Greater ? 'greater' : 'less';

        const min = 1;
        const max = 10;

        const vMax = Math.floor(random() * (max - (min + 1) + 1)) + (min + 1);
        const vMin = Math.floor(random() * ((vMax - 1) - min + 1)) + min;

        return {
            data: {
                attribute,
                relation,
                magnitudes: {
                    smaller: vMin,
                    larger: vMax
                }
            }
        };
    }
}
