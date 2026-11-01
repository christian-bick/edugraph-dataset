import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {generatorLabelRule} from '../compatibility-rules.ts';
import {resolveTwoStepOperations} from './helpers.ts';

export const twoStepGeneralLabels = [Scope.MultiStep, Scope.MultiLevelComposition, Scope.IntegerNumbers,
    Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];

export const twoStepOperationLabels = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division];
export const twoStepOperationCompatibility = [generatorLabelRule('two-step-operation-count', twoStepOperationLabels,
    selected => {
        const count = twoStepOperationLabels.filter(selected).length;
        return count >= 1 && count <= 2;
    })];

/** These existing Grade4 families retain their own full numeric envelope and unchanged resolver. */
export const TwoStepExtendedGeneratorSchema = {
    operations: [twoStepOperationLabels, resolveTwoStepOperations],
    range: [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]), resolveRangeFromLabels]
} as const;
