import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Scope} from 'edugraph-ts';
import {ConfigFromSchema, withLabelChoices} from '../../types/schema.ts';
import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {comparisonProfiles} from './profiles.ts';

const comparisonChoices = comparisonProfiles.map(({labels}) => labels);
const resolveComparisonProfile = selectExactLabelSetMap(
    comparisonProfiles.map(({labels, profile}) => [labels, profile] as const)
);
withLabelChoices(resolveComparisonProfile, {
    ...resolveComparisonProfile.labelChoices!, kind: 'alternatives',
    alternatives: comparisonChoices, relation: 'capability'
});

export const spec: GeneratorSpec = {
    generatorId: 'comparison',
    generalLabels: [
        Scope.IntegerNumbers
    ]
};


export const ComparisonGeneratorSchema = {
    comparison: [
        [...new Set(comparisonProfiles.flatMap(({labels}) => labels))],
        resolveComparisonProfile,
        comparisonChoices
    ]
} as const;

export type ComparisonGeneratorConfig = ConfigFromSchema<typeof ComparisonGeneratorSchema>;
