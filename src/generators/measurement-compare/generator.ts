import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementCompareProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class MeasurementCompareGenerator implements ProblemGenerator<MeasurementCompareProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints = {} } = input;

        const validAttributes: ('length' | 'weight')[] = [];
        if (!labels || labels.length === 0) {
            validAttributes.push('length', 'weight');
        } else {
            if (labels.some(l => isSubConceptOf(l, Scope.LengthMeasurement))) validAttributes.push('length');
            if (labels.some(l => isSubConceptOf(l, Scope.WeightMeasurement))) validAttributes.push('weight');
            if (validAttributes.length === 0) {
                // Default fallback if no specific scope provided
                validAttributes.push('length', 'weight');
            }
        }

        const attribute = validAttributes[Math.floor(random() * validAttributes.length)];
        const wantsGreater = labels.some(l => isSubConceptOf(l, Scope.Greater));
        const wantsLess = labels.some(l => isSubConceptOf(l, Scope.Less));
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
