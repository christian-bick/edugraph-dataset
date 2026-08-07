import {ViewValidationError} from '../../../helpers/validation.ts';
import {
    LengthComparisonRelation,
    MediatedLengthComparisonProblem
} from '../../../../types/problems.ts';

export function deriveMediatedAnswer(
    chainRelation: LengthComparisonRelation,
    askedRelation: LengthComparisonRelation
): 'A' | 'C' {
    if (chainRelation === 'longer') return askedRelation === 'longer' ? 'A' : 'C';
    return askedRelation === 'longer' ? 'C' : 'A';
}

export function validateMediatedComparisonProblem(
    data: MediatedLengthComparisonProblem
): void {
    const objectIds = Array.isArray(data.objects)
        ? data.objects.map(object => object?.id)
        : [];
    const [first, second] = Array.isArray(data.premises) ? data.premises : [];
    const validRelation = (relation: unknown): relation is LengthComparisonRelation => (
        relation === 'longer' || relation === 'shorter'
    );

    if (objectIds.length !== 3 || objectIds.join(',') !== 'A,B,C'
        || data.intermediary !== 'B'
        || data.premises.length !== 2 || !first || !second
        || first.subject !== 'A' || first.reference !== 'B'
        || second.subject !== 'B' || second.reference !== 'C'
        || !validRelation(first.relation) || second.relation !== first.relation
        || !validRelation(data.askedRelation)
        || data.answer !== deriveMediatedAnswer(first.relation, data.askedRelation)) {
        throw new ViewValidationError(
            'measure-mediated-comparison',
            'Expected a valid A-to-B-to-C relation chain with a correctly derived endpoint answer.'
        );
    }
}
