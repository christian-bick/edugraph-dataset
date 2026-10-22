import type {ReactNode} from 'react';
import type {CoordinatePointsProblem, CoordinateReflectionRelationProblem, RationalCoordinatePoint} from '../../../types/problems.ts';
import {formatCoordinatePair, formatCoordinateScalar} from './rational-coordinate-helpers.ts';
import {RationalCoordinatePlane} from './rational-coordinate-plane.tsx';

function Card({title, children}: {title: string; children: ReactNode}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-800 shadow-sm" style={{width: 830, maxWidth: '95vw'}}><h1 className="mb-3 text-2xl font-bold text-indigo-950">{title}</h1>{children}</main>;
}
function Solution({children}: {children: ReactNode}) {
    return <section className="mt-4 space-y-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-lg leading-relaxed text-emerald-900" data-role="solution">{children}</section>;
}
function ExplanationSpace() {
    return <section className="mt-4 space-y-7 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-600" data-role="blank-explanation"><p>Write your explanation:</p><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /></section>;
}
function Pairs({points, role}: {points: readonly RationalCoordinatePoint[]; role: string}) {
    return <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-slate-100 p-4 font-mono text-lg font-semibold" data-role={role}>
        {points.map(point => <span key={point.id}>{point.id} = {formatCoordinatePair(point)}</span>)}
    </div>;
}
type PointProps = {data: CoordinatePointsProblem; isSolutionView: boolean; seed: number};

export function CoordinatePlottingBody({data, isSolutionView, seed}: PointProps) {
    return <Card title="Plot the ordered pairs">
        <p className="text-lg">Plot and label every point on the scaled coordinate plane.</p>
        <Pairs points={data.points} role="given-ordered-pairs" />
        <RationalCoordinatePlane axes={data.axes} points={isSolutionView ? data.points : []} solutionPoints={isSolutionView} showQuadrants={false} reflectionSteps={[]} seed={seed} />
    </Card>;
}
export function CoordinateReadingBody({data, isSolutionView, seed}: PointProps) {
    return <Card title="Read the ordered pairs">
        <p className="text-lg">Write the ordered pair for each marked point. Read x first, then y.</p>
        <RationalCoordinatePlane axes={data.axes} points={data.points} solutionPoints={false} showQuadrants={false} reflectionSteps={[]} seed={seed} />
        {isSolutionView ? <Solution>{data.points.map(point => <p className="font-mono font-semibold" key={point.id} data-role="coordinate-answer">{point.id} = {formatCoordinatePair(point)}</p>)}</Solution> :
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 rounded-xl border-2 border-dashed border-slate-300 p-4 text-lg" data-role="blank-ordered-pairs">{data.points.map(point => <p key={point.id}>{point.id} = (________, ________)</p>)}</div>}
    </Card>;
}
const signWord = (sign: number) => sign === 0 ? 'zero' : sign < 0 ? 'negative' : 'positive';
function LocationReason({point}: {point: RationalCoordinatePoint}) {
    return <p data-role="location-reason"><strong>{point.id}:</strong> x is {signWord(point.x.sign)} and y is {signWord(point.y.sign)}. {point.locationTag === 'origin' ? 'Both coordinates are zero, so the point is at the origin.' :
        point.locationTag === 'x-axis' || point.locationTag === 'y-axis' ? `The point lies on the ${point.locationTag}; axis points are not in a quadrant.` : `The point is in ${point.locationTag.replace('quadrant-', 'Quadrant ')}.`}</p>;
}
export function CoordinateQuadrantBody({data, isSolutionView, seed}: PointProps) {
    return <Card title="Coordinate signs and locations">
        <p className="text-lg">Explain how the signs of each ordered pair determine its location. For any axis or origin points, explain those cases separately.</p>
        <Pairs points={data.points} role="given-ordered-pairs" />
        <RationalCoordinatePlane axes={data.axes} points={data.points} solutionPoints={false} showQuadrants={true} reflectionSteps={[]} seed={seed} />
        {isSolutionView ? <Solution>{data.points.map(point => <LocationReason point={point} key={point.id} />)}</Solution> : <ExplanationSpace />}
    </Card>;
}
export function CoordinateReflectionBody({data, isSolutionView, seed}: {data: CoordinateReflectionRelationProblem; isSolutionView: boolean; seed: number}) {
    const points = [data.original, ...data.steps.map(step => step.after), ...data.steps.map(step => step.mirror.foot)];
    const distinct = [...new Map(points.map(point => [point.id, point])).values()];
    return <Card title="Interpret coordinate reflections">
        <p className="text-lg">Explain which coordinate stays unchanged and which is negated in each reflection. Explain any points that stay in the same position.</p>
        <ol className="mt-3 space-y-2 rounded-xl bg-slate-100 p-4 text-lg" data-role="given-reflection-steps">{data.steps.map((step, index) => <li key={index}>Step {index + 1}: reflect {step.before.id} across the {step.axis}-axis to {step.after.id}.</li>)}</ol>
        <Pairs points={distinct} role="given-reflection-points" />
        <RationalCoordinatePlane axes={data.axes} points={distinct} solutionPoints={false} showQuadrants={false} reflectionSteps={data.steps} seed={seed} />
        {isSolutionView ? <Solution>{data.steps.map((step, index) => <div key={index} data-role="reflection-reason">
            <p><strong>Step {index + 1}:</strong> the {step.unchanged.component}-coordinate stays {formatCoordinateScalar(step.unchanged.value)}. The {step.negated.component}-coordinate is negated: {formatCoordinateScalar(step.negated.before)} becomes {formatCoordinateScalar(step.negated.after)}.</p>
            <p>{step.negated.valueChanged ? `${step.before.id} and ${step.after.id} lie on opposite sides of the ${step.axis}-axis.` : `Negating zero leaves zero unchanged, so ${step.before.id} and ${step.after.id} coincide on the ${step.axis}-axis.`} Their distances to that axis are {formatCoordinateScalar(step.mirror.beforeDistance)} and {formatCoordinateScalar(step.mirror.afterDistance)}, with perpendicular foot {step.mirror.foot.id}.</p>
        </div>)}</Solution> : <ExplanationSpace />}
    </Card>;
}
