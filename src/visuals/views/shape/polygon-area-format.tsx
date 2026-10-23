import type {ExactCoefficientArithmetic, PolygonAreaDissectionProblem as Problem, PolygonAreaLengthMeasure, PolygonAreaSum} from '../../../types/problems.ts';
import {exactNumericNotation, exactNumericValue} from '../operations/numerical-power-expression-format.tsx';

export const areaPointName = (data: Problem, id: string): string => {
    const index = data.points.findIndex(point => point.id === id);
    return index < 26 ? String.fromCharCode(65 + index) : `P${index + 1}`;
};
export const areaDimensionName = (data: Problem, id: string): string => `D${data.measures.findIndex(measure => measure.measureId === id) + 1}`;
export const areaCellName = (data: Problem, id: string): string => `T${data.source.cells.findIndex(cell => cell.cellId === id) + 1}`;
export const areaMeasure = (data: Problem, id: string): PolygonAreaLengthMeasure => data.measures.find(measure => measure.measureId === id)!;
export const areaRegionName = (data: Problem): string => ({'floor-region': 'floor region', 'garden-bed': 'garden bed', 'fabric-panel': 'fabric panel'}[data.context.kind]);
const operationSymbols = {addition: '+', subtraction: '-', multiplication: '×', division: '÷'} as const;
const atom = (value: ExactCoefficientArithmetic['result']) => value.numerator < 0 || value.denominator !== 1 ? `(${exactNumericValue(value)})` : exactNumericValue(value);

export function PolygonAreaArithmetic({value}: {value: ExactCoefficientArithmetic}) {
    return <span>{atom(value.operands[0])} {operationSymbols[value.operation]} {atom(value.operands[1])} = {exactNumericValue(value.result)}</span>;
}

/** Only the supplied source closure is used: no closure or missing measurement is computed. */
export function PolygonAreaPremises({data, story}: {data: Problem; story: boolean}) {
    return <div className="space-y-2" data-role={story ? 'polygon-area-story' : 'polygon-area-givens'}>
        <p>{story ? `The outlined ${areaRegionName(data)} is the original region whose area is required.` : 'Find the area of the original outlined polygon.'} Lengths are measured in {data.units.length.name}; give area in {data.units.area.name}.</p>
        {data.context.dimensions.map(dimension => {
            const measure = areaMeasure(data, dimension.measureId), name = areaDimensionName(data, measure.measureId);
            const reference = `${areaPointName(data, measure.segment.fromId)} to ${areaPointName(data, measure.segment.toId)}`;
            const meaning = dimension.meaning.replaceAll('-', ' ');
            return <p key={measure.measureId} data-role="polygon-area-dimension-premise"><strong>{name}</strong> is the {meaning} from {reference}.{' '}
                {measure.kind === 'measured-length' ? <>{story ? 'Its length is ' : `${name} = `}{exactNumericNotation(measure.notation)} {data.units.length.name}.</>
                    : measure.kind === 'scaled-length' ? story ? <>Its length is {exactNumericValue(measure.factor)} times {areaDimensionName(data, measure.sourceMeasureId)}.</>
                        : <>{name} = ({exactNumericValue(measure.factor)}) × {areaDimensionName(data, measure.sourceMeasureId)}.</>
                        : story ? <>Its length is {measure.arithmetic.operation === 'addition' ? 'the sum of' : 'the difference between'} {areaDimensionName(data, measure.firstMeasureId)} and {areaDimensionName(data, measure.secondMeasureId)}{measure.arithmetic.operation === 'subtraction' ? ', in that order' : ''}.</>
                            : <>{name} = {areaDimensionName(data, measure.firstMeasureId)} {operationSymbols[measure.arithmetic.operation]} {areaDimensionName(data, measure.secondMeasureId)}.</>}
            </p>;
        })}
    </div>;
}

export function PolygonAreaLengthWork({data}: {data: Problem}) {
    return <div className="space-y-1" data-role="polygon-area-length-work">{data.measures.filter(measure => measure.kind !== 'measured-length').map(measure => <p key={measure.measureId}>{areaDimensionName(data, measure.measureId)}: <PolygonAreaArithmetic value={measure.arithmetic} /> {data.units.length.name}.</p>)}</div>;
}

export function PolygonAreaSumWork({data, value, assembled}: {data: Problem; value: PolygonAreaSum; assembled: boolean}) {
    return <div className="space-y-1" data-role={assembled ? 'polygon-area-target-sum' : 'polygon-area-source-sum'}>
        <p>{assembled ? 'Assembled pieces' : 'Original region'}: {value.pieceIds.map(id => {
            if (!assembled) return areaCellName(data, id);
            const placement = data.assembly.placements.find(piece => piece.placementId === id)!;
            return `${areaCellName(data, placement.sourceCellId)} (copy ${placement.copyIndex + 1})`;
        }).join(' + ')}.</p>
        {value.additions.map((addition, index) => <p key={index}><PolygonAreaArithmetic value={addition} /></p>)}
        <p>Area total: {exactNumericValue(value.total)} {data.units.area.name}.</p>
    </div>;
}
