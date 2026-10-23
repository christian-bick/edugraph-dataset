import type {ExactCoefficientArithmetic, NetPlanarFace, NetScalar, PolyhedralNetProblem as Problem} from '../../../types/problems.ts';
import {exactNumericValue} from '../operations/numerical-power-expression-format.tsx';

export const netValue = exactNumericValue;
export const netNumber = (value: NetScalar): number => value.numerator / value.denominator;
export const netFaceName = (data: Problem, id: string): string => `F${data.solid.faces.findIndex(face => face.faceId === id) + 1}`;
export const netVertexName = (data: Problem, id: string): string => {
    const index = data.solid.vertices.findIndex(vertex => vertex.vertexId === id);
    return index < 26 ? String.fromCharCode(65 + index) : `V${index + 1}`;
};
export const netUnit = (data: Problem): string => data.unit.length === 'centimeters' ? 'cm' : 'm';
export const netSquareUnit = (data: Problem): string => data.unit.area === 'square-centimeters' ? 'cm²' : 'm²';
export const netDimensionName = (data: Problem, face: NetPlanarFace, kind: 'B' | 'H' | 'O'): string => `${kind}${data.solid.faces.findIndex(value => value.faceId === face.faceId) + 1}`;
export const netFace = (data: Problem, id: string): NetPlanarFace => data.net.faces.find(face => face.faceId === id)!;
export const netBaseNames = (data: Problem, face: NetPlanarFace): readonly [string, string] => {
    const index = face.measure.baseEdgeIndex;
    return [netVertexName(data, face.vertices[index].solidVertexId), netVertexName(data, face.vertices[(index + 1) % face.vertices.length].solidVertexId)];
};
export const netRectangleHeightNames = (data: Problem, face: NetPlanarFace): readonly [string, string] => {
    if (face.measure.kind !== 'rectangle') throw new Error('Rectangle side names require a rectangle face.');
    const index = face.measure.adjacentEdgeIndex;
    return [netVertexName(data, face.vertices[index].solidVertexId), netVertexName(data, face.vertices[(index + 1) % face.vertices.length].solidVertexId)];
};
const operations = {addition: '+', subtraction: '-', multiplication: '×', division: '÷'} as const;
const atom = (value: NetScalar) => value.denominator !== 1 || value.numerator < 0 ? `(${netValue(value)})` : netValue(value);
export function NetArithmetic({work}: {work: ExactCoefficientArithmetic}) {
    return <span>{atom(work.operands[0])} {operations[work.operation]} {atom(work.operands[1])} = {netValue(work.result)}</span>;
}

/** Numerical premises occur once; story leaves require their prose to recover them. */
export function NetDimensionPremises({data, story, construction}: {data: Problem; story: boolean; construction: boolean}) {
    const object = data.context.kind === 'closed-carton' ? 'closed carton' : 'closed solid model';
    return <div className="space-y-2 text-[16px] leading-relaxed" data-role={story ? 'net-story-premises' : 'net-dimension-premises'}>
        <p>{story ? `A ${object} has the shape shown.` : 'The solid is closed.'} Include every external face, including its bases. Lengths are in {data.unit.length}.</p>
        {data.solid.faces.map(source => {
            const face = netFace(data, source.faceId), measure = face.measure, [start, end] = netBaseNames(data, face);
            return <p key={face.faceId} data-role="net-face-premise"><strong>{netFaceName(data, face.faceId)}</strong>{story ? ': ' : ' — '}
                {story ? <>The side from {start} to {end} measures {netValue(measure.base)} {data.unit.length}. </>
                    : <>{netDimensionName(data, face, 'B')} ({start}{end}) = {netValue(measure.base)} {netUnit(data)}; </>}
                {measure.kind === 'rectangle' ? story ? <>The perpendicular rectangle side {netRectangleHeightNames(data, face).join('')} measures {netValue(measure.height)} {data.unit.length}.</>
                    : <>{netDimensionName(data, face, 'H')} ({netRectangleHeightNames(data, face).join('')}) = {netValue(measure.height)} {netUnit(data)}.</>
                    : <>{story ? <>Its perpendicular face height measures {netValue(measure.height)} {data.unit.length}.</>
                        : <>{netDimensionName(data, face, 'H')} = {netValue(measure.height)} {netUnit(data)}.</>}
                        {construction && <>{' '}{story ? <>Along the directed base from {start} toward {end}, the altitude foot has signed offset {netValue(measure.baseOffset)} {data.unit.length} from {start}.</>
                            : <>{netDimensionName(data, face, 'O')} = {netValue(measure.baseOffset)} {netUnit(data)} (signed from {start} toward {end}).</>}</>}
                    </>}
            </p>;
        })}
    </div>;
}

export function NetSurfaceWork({data}: {data: Problem}) {
    return <div className="space-y-3 text-emerald-700" data-role="net-area-work">
        {data.solid.faces.map(source => {
            const face = netFace(data, source.faceId), measure = face.measure;
            return <div key={face.faceId}><p className="font-semibold">{netFaceName(data, face.faceId)}: {measure.kind === 'rectangle' ? 'rectangle area = base × height' : 'triangle area = base × height × 1/2'}.</p>
                <p><NetArithmetic work={measure.kind === 'rectangle' ? measure.areaProduct : measure.baseHeightProduct} />{measure.kind === 'rectangle' && ` ${netSquareUnit(data)}`}</p>
                {measure.kind === 'triangle' && <p><NetArithmetic work={measure.halfAreaProduct} /> {netSquareUnit(data)}</p>}
            </div>;
        })}
        <div className="border-t border-emerald-300 pt-3"><p>Count every face once:</p>
            <p>{data.solid.faces.map(source => `${netFaceName(data, source.faceId)} (${netValue(netFace(data, source.faceId).measure.area)})`).join(' + ')} = {netValue(data.surfaceArea)} {netSquareUnit(data)}.</p>
            {data.surfaceAdditivity.map((step, index) => <p key={index} data-role="net-surface-addition">After {netFaceName(data, step.faceId)}: <NetArithmetic work={step.arithmetic} /> {netSquareUnit(data)}</p>)}
            <p className="mt-2 text-xl font-bold" data-role="net-area-answer">Surface area = {netValue(data.surfaceArea)} {netSquareUnit(data)}.</p>
        </div>
    </div>;
}
