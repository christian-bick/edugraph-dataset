import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {hasLabel, selectExactMatch, selectExactLabelSetMap} from "../../../lib/resolvers.ts";
import {rulerRangeProfiles} from './numeric-domain.ts';

const exactTool = exactResolver((labels: string[]) => {
    if (labels.includes(Scope.CentimeterScale) || labels.includes(Scope.MeterScale)) return undefined;
    return selectExactMatch(labels, [Scope.PhysicalRuler, Scope.Tapemeter]);
});
withLabelChoices(exactTool, {
    kind: 'alternatives',
    contextLabels: [Scope.CentimeterScale, Scope.MeterScale]
});

import {targetLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-length',
    compatibility: [targetLabelRule('tool-based-length-context', [
        Scope.CentimeterScale, Scope.MeterScale
    ], selected => !selected(Scope.CentimeterScale) && !selected(Scope.MeterScale))],
    generalLabels: [
        Area.MeasuringLength,
        Scope.NumbersWithoutNegatives
    ]
};

const rangeChoices = rulerRangeProfiles.map(profile => profile.labels);
export const MeasurementLengthGeneratorSchema = {
    useDecimals: [
        [
            Scope.IntegerNumbers,
            Scope.DecimalNumbers
        ],
        hasLabel(Scope.DecimalNumbers)
    ],
    range: [
        [...new Set(rangeChoices.flat())],
        withLabelChoices(selectExactLabelSetMap(rulerRangeProfiles.map(profile =>
            [profile.labels, profile.range] as const)),
        {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}),
        rangeChoices
    ],
    tool: [
        [Scope.PhysicalRuler, Scope.Tapemeter],
        exactTool
    ]
} as const;

export type MeasurementLengthGeneratorConfig = ConfigFromSchema<typeof MeasurementLengthGeneratorSchema>;
