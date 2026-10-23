import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalDataScalar, NumericalDataStudy, NumericalDepartureCriterion} from '../../types/problems.ts';
import {compareSignedRationals, makeSignedRational} from '../number/signed-rational-helpers.ts';
import {makeSignedRationalAxis} from '../number/signed-rational-axis-helpers.ts';
import type {NumericalDataBuildInput} from './numerical-data-helpers.ts';

/** Mathematical theorem bundles, independent of every consuming learner task. */
export const numericalRelationSets = {
    distributionMean: ['empirical-shape', 'observed-variability', 'arithmetic-mean', 'mean-absolute-deviation'],
    distributionMedian: ['empirical-shape', 'observed-variability', 'median', 'interquartile-range'],
    mean: ['arithmetic-mean'], median: ['median'], mad: ['mean-absolute-deviation'], iqr: ['interquartile-range'],
    frequency: ['frequency-partition'], quartiles: ['quartiles', 'median'], sample: ['sample-cardinality'],
    variable: ['variable-recording'], departure: ['empirical-shape', 'criterion-backed-departure'],
    sensitivity: ['arithmetic-mean', 'median', 'mean-absolute-deviation', 'interquartile-range', 'empirical-shape', 'single-record-replacement']
} as const;

const q = (n: number, d = 1): NumericalDataScalar => makeSignedRational(n, d);
type Relations = NumericalDataBuildInput['relations'];
type Source = Readonly<{
    populationName: string; observationalUnitName: string; unitName: string; occasionName: string;
    selection: NumericalDataStudy['selection']; attribute: NumericalDataStudy['attribute']; goal: NumericalDataStudy['goal'];
    values: readonly [NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, NumericalDataScalar, ...NumericalDataScalar[]];
    valueScale: readonly [NumericalDataScalar, number, number]; countMaximum: number;
    edges: readonly [NumericalDataScalar, NumericalDataScalar, ...NumericalDataScalar[]];
    criterion?: NumericalDepartureCriterion;
    replacement?: Readonly<{recordOrdinal: number; value: NumericalDataScalar}>;
}>;

// Only literal source facts enter this catalog. The mathematical builders derive
// all summaries, memberships, plot positions, shape witnesses and selected proofs.
const sources: readonly Source[] = [
    {populationName: 'the ribbons in a display collection', observationalUnitName: 'ribbon', unitName: 'Ribbon', occasionName: 'measurement session',
        selection: 'distinct-units', attribute: {id: 'attribute', name: 'recorded ribbon length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1, 2)},
        goal: {kind: 'equally-allocated-total'}, values: [q(1, 2), q(1), q(1), q(3, 2), q(2), q(3)],
        valueScale: [q(1, 2), 0, 6], countMaximum: 6, edges: [q(0), q(1), q(2), q(3)], replacement: {recordOrdinal: 6, value: q(3, 2)}},
    {populationName: 'the recorded journeys', observationalUnitName: 'rider', unitName: 'Rider', occasionName: 'journey',
        selection: 'repeated-occasions', attribute: {id: 'attribute', name: 'recorded journey duration', kind: 'duration', unit: 'minutes', method: 'timer', precision: q(1)},
        goal: {kind: 'describe-recorded-collection'}, values: [q(1), q(2), q(4), q(5)],
        valueScale: [q(1), 0, 6], countMaximum: 4, edges: [q(0), q(2), q(4), q(6)], replacement: {recordOrdinal: 4, value: q(3)}},
    {populationName: 'the collection trays', observationalUnitName: 'tray', unitName: 'Tray', occasionName: 'inspection',
        selection: 'distinct-units', attribute: {id: 'attribute', name: 'recorded counter count', kind: 'count', unit: 'items', method: 'counted', countedObject: 'counters'},
        goal: {kind: 'routine-member'}, values: [q(2), q(2), q(3), q(3), q(3), q(4), q(4)],
        valueScale: [q(1), 0, 6], countMaximum: 8, edges: [q(0), q(2), q(4), q(6)]},
    {populationName: 'the reading-period observations', observationalUnitName: 'pupil', unitName: 'Pupil', occasionName: 'reading period',
        selection: 'distinct-units', attribute: {id: 'attribute', name: 'books recorded for the reading period', kind: 'count', unit: 'items', method: 'counted', countedObject: 'books'},
        goal: {kind: 'routine-member'}, values: [q(1), q(2), q(3), q(4), q(9)],
        valueScale: [q(2), 0, 5], countMaximum: 6, edges: [q(0), q(2), q(4), q(6), q(8), q(10)],
        criterion: {kind: 'separated-from-routine-majority', lower: q(1), upper: q(4), minimumSeparation: q(3), referenceSource: 'study-reference-range'},
        replacement: {recordOrdinal: 5, value: q(3)}},
    {populationName: 'the recorded service-station visits', observationalUnitName: 'service station', unitName: 'Station', occasionName: 'visit',
        selection: 'repeated-occasions', attribute: {id: 'attribute', name: 'recorded waiting duration', kind: 'duration', unit: 'minutes', method: 'timer', precision: q(1)},
        goal: {kind: 'routine-member'}, values: [q(2), q(2), q(3), q(3), q(3), q(4), q(4), q(15)],
        valueScale: [q(2), 0, 8], countMaximum: 8, edges: [q(0), q(2), q(4), q(6), q(8), q(10), q(12), q(14), q(16)],
        criterion: {kind: 'separated-from-routine-majority', lower: q(2), upper: q(4), minimumSeparation: q(3), referenceSource: 'routine-operation-reference'},
        replacement: {recordOrdinal: 8, value: q(3)}},
    {populationName: 'the recorded air-temperature checks', observationalUnitName: 'thermometer location', unitName: 'Location', occasionName: 'check',
        selection: 'repeated-occasions', attribute: {id: 'attribute', name: 'recorded air temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1)},
        goal: {kind: 'routine-member'}, values: [q(-5), q(-4), q(-4), q(-3), q(-3), q(-2), q(6)],
        valueScale: [q(2), -3, 3], countMaximum: 8, edges: [q(-6), q(-4), q(-2), q(0), q(2), q(4), q(6)],
        criterion: {kind: 'separated-from-routine-majority', lower: q(-5), upper: q(-2), minimumSeparation: q(3), referenceSource: 'study-reference-range'},
        replacement: {recordOrdinal: 7, value: q(-3)}},
    {populationName: 'the strips in a material collection', observationalUnitName: 'strip', unitName: 'Strip', occasionName: 'measurement session',
        selection: 'distinct-units', attribute: {id: 'attribute', name: 'recorded strip length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1)},
        goal: {kind: 'describe-recorded-collection'}, values: [q(3), q(3), q(3), q(3)],
        valueScale: [q(1), 0, 6], countMaximum: 4, edges: [q(0), q(2), q(4), q(6)]},
    {populationName: 'the supply-tray observations', observationalUnitName: 'tray', unitName: 'Tray', occasionName: 'distribution check',
        selection: 'distinct-units', attribute: {id: 'attribute', name: 'recorded token count', kind: 'count', unit: 'items', method: 'counted', countedObject: 'tokens'},
        goal: {kind: 'equally-allocated-total'}, values: [q(0), q(2), q(2), q(4), q(7)],
        valueScale: [q(1), 0, 8], countMaximum: 6, edges: [q(0), q(2), q(4), q(6), q(8)],
        criterion: {kind: 'separated-from-routine-majority', lower: q(0), upper: q(4), minimumSeparation: q(3), referenceSource: 'routine-operation-reference'},
        replacement: {recordOrdinal: 5, value: q(2)}},
    {populationName: 'the recorded jumps', observationalUnitName: 'participant', unitName: 'Participant', occasionName: 'jump',
        selection: 'repeated-occasions', attribute: {id: 'attribute', name: 'recorded jump duration', kind: 'duration', unit: 'seconds', method: 'timer', precision: q(1, 4)},
        goal: {kind: 'describe-recorded-collection'}, values: [q(1, 4), q(1, 2), q(1, 2), q(3, 4), q(1)],
        valueScale: [q(1, 4), 0, 4], countMaximum: 6, edges: [q(0), q(1, 4), q(1, 2), q(3, 4), q(1)]},
    {populationName: 'the recorded air-temperature checks', observationalUnitName: 'thermometer location', unitName: 'Location', occasionName: 'check',
        selection: 'repeated-occasions', attribute: {id: 'attribute', name: 'recorded air temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1, 2)},
        goal: {kind: 'routine-member'}, values: [q(-3, 2), q(-1), q(-1, 2), q(0), q(5, 2)],
        valueScale: [q(1), -2, 3], countMaximum: 6, edges: [q(-2), q(-1), q(0), q(1), q(2), q(3)],
        criterion: {kind: 'separated-from-routine-majority', lower: q(-3, 2), upper: q(0), minimumSeparation: q(2), referenceSource: 'study-reference-range'},
        replacement: {recordOrdinal: 5, value: q(-1, 2)}}
];

export function isNumericalRelationSet(value: unknown): value is Relations {
    try {
        if (!Array.isArray(value) || value.length < 1 || value.length > 6) return false;
        for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
        return new Set(value).size === value.length && Object.values(numericalRelationSets)
            .some(candidate => candidate.length === value.length && candidate.every(kind => value.includes(kind)));
    } catch { return false; }
}

function pool(relations: Relations): readonly Source[] {
    if (!isNumericalRelationSet(relations)) throw new GeneratorValidationError('numerical-data', 'Choose one supported mathematical relation set.');
    return sources.filter(source => (!relations.includes('criterion-backed-departure') || source.criterion !== undefined)
        && (!relations.includes('single-record-replacement') || source.replacement !== undefined)
        && (!relations.includes('observed-variability') || source.values.some(value => compareSignedRationals(value, source.values[0]) !== 0)));
}

export const numericalDataInputCount = (relations: Relations): number => pool(relations).length * 3;

/** A deterministic literal input instance; no derived answers or view choices. */
export function numericalDataInput(relations: Relations, selection: number): NumericalDataBuildInput {
    const eligible = pool(relations);
    if (!Number.isSafeInteger(selection) || selection < 0 || selection >= eligible.length * 3) {
        throw new GeneratorValidationError('numerical-data', 'Choose an existing concrete source instance.');
    }
    const source = eligible[selection % eligible.length]!, multiplier = 1 + Math.floor(selection / eligible.length);
    const scale = (value: NumericalDataScalar) => q(value.numerator * multiplier, value.denominator);
    const unitCount = source.selection === 'distinct-units' ? source.values.length : 1;
    const occasionCount = source.selection === 'distinct-units' ? 1 : source.values.length;
    const unit = (i: number) => ({id: `unit-${i + 1}`, name: `${source.unitName} ${i + 1}`});
    const occasion = (i: number) => ({id: `occasion-${i + 1}`, name: `${source.occasionName} ${i + 1}`});
    const record = (value: NumericalDataScalar, index: number) => ({id: `record-${index + 1}`,
        unitId: unit(source.selection === 'distinct-units' ? index : 0).id,
        occasionId: occasion(source.selection === 'distinct-units' ? 0 : index).id, value: scale(value)});
    const [first, second, third, fourth, ...rest] = source.values, [firstEdge, secondEdge, ...otherEdges] = source.edges;
    const [step, firstTick, lastTick] = source.valueScale, criterion = source.criterion, replacement = source.replacement;
    return {study: {id: 'study', populationName: source.populationName, observationalUnitName: source.observationalUnitName,
        units: [unit(0), ...Array.from({length: unitCount - 1}, (_, i) => unit(i + 1))],
        occasions: [occasion(0), ...Array.from({length: occasionCount - 1}, (_, i) => occasion(i + 1))],
        selection: source.selection, attribute: source.attribute.kind === 'count' ? {...source.attribute}
            : {...source.attribute, precision: {...source.attribute.precision}}, goal: {...source.goal}},
        records: [record(first, 0), record(second, 1), record(third, 2), record(fourth, 3), ...rest.map((value, i) => record(value, i + 4))],
        axes: {value: makeSignedRationalAxis(scale(step), firstTick, lastTick), count: makeSignedRationalAxis(q(1), 0, source.countMaximum)},
        histogramEdges: [scale(firstEdge), scale(secondEdge), ...otherEdges.map(scale)],
        quartileConvention: 'median-of-halves-excluding-odd-center', whiskerConvention: 'observed-minimum-maximum',
        departureCriterion: criterion ? {...criterion, lower: scale(criterion.lower), upper: scale(criterion.upper), minimumSeparation: scale(criterion.minimumSeparation)} : null,
        relations, ...(relations.includes('single-record-replacement') && replacement ? {replacement: {
            recordId: `record-${replacement.recordOrdinal}`, value: scale(replacement.value), referenceSource: 'documented-routine-value' as const}} : {})};
}
