import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementCompareProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {MeasurementCompareGeneratorConfig, MeasurementCompareGeneratorSchema} from "./spec.ts";

export class MeasurementCompareGenerator implements ProblemGenerator<MeasurementCompareProblem, MeasurementCompareGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementCompareGeneratorSchema;

    generate(config: MeasurementCompareGeneratorConfig): ProblemStub | null {
        const attributeLabel = config.attribute;
        const relationLabel = config.relation;

        if (!attributeLabel || !relationLabel) return null;

        const attribute = attributeLabel === Scope.LengthMeasurement ? 'length' : 'weight';
        
        let relation: string;
        if (attribute === 'length') {
            relation = relationLabel === Scope.Greater ? 'longer' : 'shorter';
        } else {
            relation = relationLabel === Scope.Greater ? 'heavier' : 'lighter';
        }

        const min = 1;
        const max = 10;

        const vMax = Math.floor(random() * (max - (min + 1) + 1)) + (min + 1);
        const vMin = Math.floor(random() * ((vMax - 1) - min + 1)) + min;

        const answer = random() > 0.5 ? 'A' : 'B';

        let val1 = 0;
        let val2 = 0;

        const isGreater = relation === 'longer' || relation === 'heavier';
        if (isGreater) {
            if (answer === 'A') {
                val1 = vMax;
                val2 = vMin;
            } else {
                val1 = vMin;
                val2 = vMax;
            }
        } else {
            if (answer === 'A') {
                val1 = vMin;
                val2 = vMax;
            } else {
                val1 = vMax;
                val2 = vMin;
            }
        }

        return {
            id: `measurement-compare-${attribute}-${relation}-${answer}-${val1}-${val2}`,
            data: {
                attribute: attribute as 'length' | 'weight',
                relation,
                val1,
                val2,
                answer
            }
        };
    }
}
