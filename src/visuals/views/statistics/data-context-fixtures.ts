import type {NumericalDataScalar, NumericalDataStudy} from '../../../types/problems.ts';
import type {NumericalDataBuildInput} from '../../../generators/statistics/numerical-data-helpers.ts';
import {makeSignedRationalAxis} from '../../../generators/number/signed-rational-axis-helpers.ts';

export const contextScalar = (numerator: number, denominator = 1): NumericalDataScalar => ({numerator, denominator});
const q = contextScalar;
type Values = NumericalDataBuildInput['records'][number]['value'][];
const names = ['Amber', 'Birch', 'Cedar', 'Dawn', 'Elm', 'Fern', 'Grove', 'Hazel'];
function source(values: Values, attribute: NumericalDataStudy['attribute']): Pick<NumericalDataBuildInput, 'study' | 'records'> {
    const units: NumericalDataStudy['units'] = [{id: 'u-a', name: names[0]}, ...values.slice(1).map((_, index) => ({id: `u-${index + 1}`, name: names[index + 1]}))];
    const rows = values.map((value, index) => ({id: `r-${index}`, unitId: units[index].id, occasionId: 'visit', value}));
    return {study: {id: 'study', populationName: 'The observations in a classroom study', observationalUnitName: 'ribbon', units,
        occasions: [{id: 'visit', name: 'Collection session'}], selection: 'distinct-units', attribute, goal: {kind: 'routine-member'}},
        records: [rows[0], rows[1], rows[2], rows[3], ...rows.slice(4)]};
}
const length: Extract<NumericalDataStudy['attribute'], {kind: 'length'}> = {id: 'length', name: 'ribbon length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1)};
const common = {axes: {value: makeSignedRationalAxis(q(2), 0, 8), count: makeSignedRationalAxis(q(1), 0, 8)},
    histogramEdges: [q(0), q(4), q(8), q(12), q(16)], quartileConvention: 'median-of-halves-excluding-odd-center',
    whiskerConvention: 'observed-minimum-maximum', departureCriterion: null} as const;

/** Independent count oracle: eight observations, four distinct values, value sum36. */
export const literalObservationInput: NumericalDataBuildInput = {...source([q(2), q(2), q(3), q(3), q(3), q(4), q(4), q(15)], length), ...common, relations: ['sample-cardinality']};
export const literalAttributeInput: NumericalDataBuildInput = {...literalObservationInput, relations: ['variable-recording']};

/** Four large integers have exact safe sum9007199254740988; four reduced long fractions also remain safe. */
const longNumerator = 2251799813685247;
function longCountInput(denominator: number): NumericalDataBuildInput {
    const value = q(longNumerator, denominator);
    return {...source([value, value, value, value], {...length, precision: q(1, denominator)}), ...common,
        axes: {value: {minimum: q(0), maximum: value, step: value, ticks: [q(0), value], zeroIndex: 0},
            count: {minimum: q(0), maximum: q(4), step: q(4), ticks: [q(0), q(4)], zeroIndex: 0}},
        histogramEdges: [q(0), value], relations: ['sample-cardinality']};
}
export const literalLongIntegerCountInput = longCountInput(1);
export const literalLongRationalCountInput = longCountInput(2251799813685246);

/** Four zero responses remain four distinct observations. */
const zeroSource = source([q(0), q(0), q(0), q(0)],
    {id: 'pencils', name: 'pencil count', kind: 'count', unit: 'items', method: 'counted', countedObject: 'pencils'});
export const literalZeroCountInput: NumericalDataBuildInput = {...zeroSource, study: {...zeroSource.study, observationalUnitName: 'tray'},
    ...common, relations: ['sample-cardinality']};
export const literalDurationInput: NumericalDataBuildInput = {...literalAttributeInput, study: {...literalAttributeInput.study,
    observationalUnitName: 'journey', attribute: {id: 'duration', name: 'journey duration', kind: 'duration', unit: 'minutes', method: 'timer', precision: q(1)}}};

const temperatures = [q(-3, 2), q(-1), q(-1, 2), q(0), q(5, 2)];
const occasions: NumericalDataStudy['occasions'] = [{id: 'dawn', name: 'Dawn'}, {id: 'morning', name: 'Morning'}, {id: 'noon', name: 'Noon'}, {id: 'afternoon', name: 'Afternoon'}, {id: 'evening', name: 'Evening'}];
const temperatureRows = temperatures.map((value, index) => ({id: `temperature-${index}`, unitId: 'station', occasionId: occasions[index].id, value}));
/** One station on five occasions gives FIVE observations; signed half-degree precision is retained. */
export const literalRepeatedCelsiusInput: NumericalDataBuildInput = {...common,
    study: {id: 'air', populationName: 'Air-temperature observations at the hill station', observationalUnitName: 'thermometer location',
        units: [{id: 'station', name: 'Hill station'}], occasions, selection: 'repeated-occasions',
        attribute: {id: 'temperature', name: 'air temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1, 2)}, goal: {kind: 'describe-recorded-collection'}},
    records: [temperatureRows[0], temperatureRows[1], temperatureRows[2], temperatureRows[3], ...temperatureRows.slice(4)],
    axes: {value: makeSignedRationalAxis(q(1), -2, 3), count: makeSignedRationalAxis(q(1), 0, 5)}, histogramEdges: [q(-2), q(-1), q(0), q(1), q(2), q(3)],
    relations: ['variable-recording']};

export const literalFullContextInput: NumericalDataBuildInput = {...literalObservationInput,
    departureCriterion: {kind: 'separated-from-routine-majority', lower: q(2), upper: q(4), minimumSeparation: q(3), referenceSource: 'study-reference-range'},
    replacement: {recordId: 'r-7', value: q(3), referenceSource: 'documented-routine-value'},
    relations: ['arithmetic-mean', 'median', 'quartiles', 'mean-absolute-deviation', 'interquartile-range', 'frequency-partition',
        'sample-cardinality', 'variable-recording', 'empirical-shape', 'observed-variability', 'criterion-backed-departure', 'single-record-replacement']};
