import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    LengthComparisonRelation,
    MediatedLengthComparisonProblem
} from '../../../types/problems.ts';
import {
    MeasurementMediatedComparisonGeneratorConfig,
    MeasurementMediatedComparisonGeneratorSchema
} from './spec.ts';

const askedRelationFor = (
    relation: MeasurementMediatedComparisonGeneratorConfig['relation']
): LengthComparisonRelation | null => {
    if (relation === Scope.Greater) return 'longer';
    if (relation === Scope.Less) return 'shorter';
    return null;
};

const answerFor = (
    premiseRelation: LengthComparisonRelation,
    askedRelation: LengthComparisonRelation
): MediatedLengthComparisonProblem['answer'] =>
    premiseRelation === askedRelation ? 'A' : 'C';

export class MeasurementMediatedComparisonGenerator implements ProblemGenerator<
    MediatedLengthComparisonProblem,
    MeasurementMediatedComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementMediatedComparisonGeneratorSchema;

    generate(config: MeasurementMediatedComparisonGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement-mediated-comparison', config, ['relation']);
        const askedRelation = askedRelationFor(config.relation);
        if (askedRelation === null) return null;

        const premiseRelation: LengthComparisonRelation = random() < 0.5 ? 'longer' : 'shorter';

        return {
            data: {
                objects: [{id: 'A'}, {id: 'B'}, {id: 'C'}],
                intermediary: 'B',
                premises: [
                    {subject: 'A', relation: premiseRelation, reference: 'B'},
                    {subject: 'B', relation: premiseRelation, reference: 'C'}
                ],
                askedRelation,
                answer: answerFor(premiseRelation, askedRelation)
            }
        };
    }
}
