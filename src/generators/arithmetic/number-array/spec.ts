import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {arrayCandidates, arrayOperations, arrayProfileChoices, arrayProfileFromSelection,
    arrayProfileLabels, resolveArrayArity, resolveArrayProfile} from './profiles.ts';

export const spec: GeneratorSpec = {
    generatorId: 'number-array',
    compatibility: [generatorLabelRule('canonical-array-domain', [
        ...arrayOperations.map(([label]) => label), Scope.TwoOperands, ...arrayProfileLabels
    ], selected => {
        const operation = arrayOperations.find(([label]) => selected(label))?.[1];
        const profile = arrayProfileFromSelection(selected);
        return operation !== undefined && profile !== undefined
            && arrayCandidates(operation, selected(Scope.TwoOperands), profile).length > 0;
    })],
    generalLabels: [
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.IntegerNumbers
    ]
};

export const NumberArrayGeneratorSchema = {
    operation: [
        [Area.Addition, Area.Multiplication, Area.PartitiveDivision, Area.QuotativeDivision],
        selectExactLabelMap([
            [Area.Addition, 'addition'],
            [Area.Multiplication, 'multiplication'],
            [Area.PartitiveDivision, 'partitive-division'],
            [Area.QuotativeDivision, 'quotative-division']
        ])
    ],
    requireTwoOperands: [
        [Scope.TwoOperands],
        resolveArrayArity,
        [[], [Scope.TwoOperands]]
    ],
    profile: [arrayProfileLabels, resolveArrayProfile, arrayProfileChoices]
} as const;

export type NumberArrayGeneratorConfig = ConfigFromSchema<typeof NumberArrayGeneratorSchema>;
