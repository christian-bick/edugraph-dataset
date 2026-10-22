import type {ReactNode} from 'react';
import type {CoordinateAxisDistanceProblem, CoordinateMetricContext, CoordinatePolygonProblem, CoordinateRouteProblem, RationalCoordinatePoint, SignedRational} from '../../../types/problems.ts';
import {formatCoordinatePair, formatCoordinateScalar as numeral} from './rational-coordinate-helpers.ts';
import {CoordinateMetricPlane} from './coordinate-metric-plane.tsx';

function Card({title, children}: {title: string; children: ReactNode}) {
    return <main className="bg-white p-6 text-lg leading-relaxed text-slate-800" style={{width: 'min(820px, 100vw)'}}><h1 className="mb-4 text-2xl font-bold text-indigo-950">{title}</h1>{children}</main>;
}
function Answer({children}: {children: ReactNode}) {
    return <section className="mt-4 space-y-3 rounded-xl border border-emerald-400 bg-emerald-50 p-4 text-emerald-900" data-role="coordinate-metric-answer">{children}</section>;
}
function Blank({children}: {children: ReactNode}) {
    return <section className="mt-4 space-y-4 rounded-xl border border-dashed border-slate-300 p-4" data-role="coordinate-metric-blank">{children}<div className="h-8 border-b border-slate-300" /></section>;
}
const grouped = (value: SignedRational) => value.numerator < 0 || value.denominator !== 1 ? `(${numeral(value)})` : numeral(value);
function role(context: CoordinateMetricContext, id: string): string {
    return context.landmarks.find(landmark => landmark.pointId === id)!.role;
}
function Givens({context, points, story}: {context: CoordinateMetricContext; points: readonly RationalCoordinatePoint[]; story: boolean}) {
    return story ? <section className="space-y-3 rounded-xl bg-slate-100 p-4" data-role="coordinate-story-prose"><p>A survey map uses meters from a common origin: positive x is east and positive y is north.</p>
        {points.map(point => <p key={point.id}>{point.id}, the {role(context, point.id)}, is {numeral(point.x.magnitude)} meters {point.x.sign < 0 ? 'west' : 'east'} and {numeral(point.y.magnitude)} meters {point.y.sign < 0 ? 'south' : 'north'} of the survey origin.</p>)}
    </section> : <section className="space-y-2 rounded-xl bg-slate-100 p-4" data-role="coordinate-math-givens"><p>Coordinate units are meters.</p>{points.map(point => <p key={point.id}>{point.id} = {formatCoordinatePair(point)}</p>)}</section>;
}
export function CoordinateDistanceBody({data, story, isSolutionView, seed}: {data: CoordinateAxisDistanceProblem; story: boolean; isSolutionView: boolean; seed: number}) {
    const edge = {fromId: data.first.id, toId: data.second.id}, absolute = data.absoluteDifference;
    return <Card title="Find the coordinate distance"><Givens context={data.context} points={[data.first, data.second]} story={story} />
        <p className="mt-4">Find the distance {story ? `from the ${role(data.context, data.first.id)} to the ${role(data.context, data.second.id)}` : `between ${data.first.id} and ${data.second.id}`}. Use the coordinate difference and absolute value. Answer with units.</p>
        <CoordinateMetricPlane axes={data.axes} points={[data.first, data.second]} edges={[edge]} solutionGeometry={false} highlightedEdge={isSolutionView ? edge : null} seed={seed} />
        {isSolutionView ? <Answer><p>The {data.separation.varyingAxis === 'x' ? 'y' : 'x'} coordinate is the same: {numeral(data.separation.fixedCoordinate)}.</p>
            <p data-role="distance-absolute-equation">Distance = |{grouped(absolute.minuend)} - {grouped(absolute.subtrahend)}| = |{grouped(absolute.difference)}| = {numeral(absolute.magnitude)} m.</p>
            <p>The distance is nonnegative{absolute.magnitude.numerator === 0 ? '; both locations coincide.' : '.'}</p>
        </Answer> : <Blank><p>Distance = |________ - ________|</p><p>Answer with units: ____________________</p></Blank>}
    </Card>;
}
export function CoordinateRouteBody({data, story, isSolutionView, seed}: {data: CoordinateRouteProblem; story: boolean; isSolutionView: boolean; seed: number}) {
    const edges = data.path.slice(1).map((id, index) => ({fromId: data.path[index]!, toId: id}));
    return <Card title="Plot the route and find its length"><Givens context={data.context} points={data.landmarks} story={story} />
        <p className="mt-4">Plot all locations. Follow the prescribed route {story ? data.path.map(id => `the ${role(data.context, id)} (${id})`).join(' to ') : data.path.join(' to ')} using its horizontal or vertical legs. Find the total route length and include units.</p>
        <CoordinateMetricPlane axes={data.axes} points={isSolutionView ? data.landmarks : []} edges={isSolutionView ? edges : []} solutionGeometry={isSolutionView} highlightedEdge={null} seed={seed} />
        {isSolutionView ? <Answer>{data.legs.map((leg, index) => <p key={index} data-role="route-leg-work">{leg.fromId} to {leg.toId}: {grouped(leg.upper)} - {grouped(leg.lower)} = {numeral(leg.distance)} m. Cumulative length: {numeral(data.cumulativeLengths[index]!)} + {numeral(leg.distance)} = {numeral(data.cumulativeLengths[index + 1]!)} m.</p>)}
            <p className="font-semibold" data-role="route-total">Total route length: {numeral(data.totalLength)} m.</p>
        </Answer> : <Blank><p>Route work: ____________________</p><p>Total route length with units: ____________________</p></Blank>}
    </Card>;
}
function SideReference({data}: {data: CoordinatePolygonProblem}) {
    const equation = data.sideDistanceEquations[0];
    if (!equation) return null;
    const relation = data.alignedSides.find(side => side.edgeIndex === equation.edgeIndex)!.separation;
    return <aside className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="given-side-distance-reference">Given side-distance reference: {relation.varyingAxis}-coordinate difference {grouped(equation.minuend)} - {grouped(equation.subtrahend)} = {numeral(equation.difference)} coordinate units.</aside>;
}
export function CoordinatePolygonConstructionBody({data, story, isSolutionView, seed}: {data: CoordinatePolygonProblem; story: boolean; isSolutionView: boolean; seed: number}) {
    return <Card title="Construct the coordinate polygon"><Givens context={data.context} points={data.vertices} story={story} />
        <p className="mt-4">Plot the vertices. Connect {story ? data.vertices.map(point => `the ${role(data.context, point.id)} (${point.id})`).join(', ') : data.vertices.map(point => point.id).join(', ')} in this order, then close the boundary by returning to {data.vertices[0].id}.</p>
        <SideReference data={data} />
        <CoordinateMetricPlane axes={data.axes} points={isSolutionView ? data.vertices : []} edges={isSolutionView ? data.edges : []} solutionGeometry={isSolutionView} highlightedEdge={null} seed={seed} />
        {isSolutionView && <Answer><p>The plotted vertices are joined in the given order and the final edge closes the polygon.</p></Answer>}
    </Card>;
}
export function CoordinatePolygonSideBody({data, story, isSolutionView, seed}: {data: CoordinatePolygonProblem; story: boolean; isSolutionView: boolean; seed: number}) {
    const side = data.alignedSides[0], edge = data.edges[side.edgeIndex]!, relation = side.separation;
    const equation = data.sideDistanceEquations.find(item => item.edgeIndex === side.edgeIndex);
    // Universal aligned-side values support this fixed task even without a selected reference equation.
    const minuend = equation ? equation.minuend : relation.upper, subtrahend = equation ? equation.subtrahend : relation.lower, result = equation ? equation.difference : relation.distance;
    return <Card title="Find the polygon side length"><Givens context={data.context} points={data.vertices} story={story} />
        <p className="mt-4">Find the length of the side {story ? `from the ${role(data.context, edge.fromId)} (${edge.fromId}) to the ${role(data.context, edge.toId)} (${edge.toId})` : `${edge.fromId}${edge.toId}`}. Use the varying coordinates. Answer with units.</p>
        <CoordinateMetricPlane axes={data.axes} points={data.vertices} edges={data.edges} solutionGeometry={false} highlightedEdge={isSolutionView ? edge : null} seed={seed} />
        {isSolutionView ? <Answer><p>The {relation.varyingAxis === 'x' ? 'y' : 'x'} coordinates are equal, so use the difference of the {relation.varyingAxis} coordinates.</p>
            <p data-role="polygon-side-work">{edge.fromId}{edge.toId} = {grouped(minuend)} - {grouped(subtrahend)} = {numeral(result)} m.</p>
        </Answer> : <Blank><p>Side length with units: ____________________</p><p>Work: ____________________</p></Blank>}
    </Card>;
}
