import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {judgmentDomain} from './domain.ts';

export const spec: GeneratorSpec<typeof ArithmeticEquationJudgmentGeneratorSchema> = {
    generatorId: 'arithmetic-equation-judgment',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

const relations = [
    [[Area.Addition, Scope.NumbersWithoutZero], 'addition-positive'],
    [[Area.Addition, Scope.NumbersWithZero], 'addition-zero'],
    [[Area.Subtraction, Scope.NumbersWithoutZero], 'subtraction-positive'],
    [[Area.Subtraction, Scope.NumbersWithZero], 'subtraction-zero']
] as const;

export const ArithmeticEquationJudgmentGeneratorSchema = {
    profile: (() => {
        const profiles = relations.flatMap(([relationLabels, relation]) => canonicalRangeProfiles
            .filter(({range}) => range.max <= 20)
            .map(({labels, range}) => [[...relationLabels, ...labels], {relation, range}] as const)
            .filter(([, profile]) => judgmentDomain(profile).length > 0));
        return [[...new Set(profiles.flatMap(([labels]) => labels))], selectExactLabelSetMap(profiles),
            profiles.map(([labels]) => labels)] as const;
    })()
} as const;

export type ArithmeticEquationJudgmentGeneratorConfig = ConfigFromSchema<typeof ArithmeticEquationJudgmentGeneratorSchema>;
