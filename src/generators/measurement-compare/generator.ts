import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementCompareProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {MeasurementCompareGeneratorConfig, MeasurementCompareGeneratorSchema} from "./spec.ts";

export class MeasurementCompareGenerator implements ProblemGenerator<MeasurementCompareProblem, MeasurementCompareGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementCompareGeneratorSchema;

    generate(config: MeasurementCompareGeneratorConfig): ProblemStub | null {
        const { hasLength, hasWeight, wantsGreater, wantsLess } = config;

        const validAttributes: ('length' | 'weight')[] = [];
        if (hasLength) validAttributes.push('length');
        if (hasWeight) validAttributes.push('weight');
        if (validAttributes.length === 0) {
            // Default fallback if no specific scope provided
            validAttributes.push('length', 'weight');
        }

        const attribute = validAttributes[Math.floor(random() * validAttributes.length)];
        let relation: string;
        if (attribute === 'length') {
            if (wantsGreater && !wantsLess) relation = 'longer';
            else if (wantsLess && !wantsGreater) relation = 'shorter';
            else relation = random() > 0.5 ? 'longer' : 'shorter';
        } else {
            if (wantsGreater && !wantsLess) relation = 'heavier';
            else if (wantsLess && !wantsGreater) relation = 'lighter';
            else relation = random() > 0.5 ? 'heavier' : 'lighter';
        }
        const answer = random() > 0.5 ? 'A' : 'B';

        let val1 = 0;
        let val2 = 0;

        if (relation === 'longer' || relation === 'heavier') {
            if (answer === 'A') {
                val1 = 8;
                val2 = 4;
            } else {
                val1 = 4;
                val2 = 8;
            }
        } else {
            // shorter or lighter
            if (answer === 'A') {
                val1 = 4;
                val2 = 8;
            } else {
                val1 = 8;
                val2 = 4;
            }
        }

        return {
            id: `measurement-compare-${attribute}-${relation}-${answer}`,
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
