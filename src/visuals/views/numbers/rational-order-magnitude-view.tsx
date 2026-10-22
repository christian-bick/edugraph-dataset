import type {ReactNode} from 'react';
import type {OrderedSignedContextMetadata, RationalMagnitudeContextProblem, RationalMagnitudeRelationProblem, RationalOrderContextProblem, RationalOrderRelationProblem, SignedContextObservation, SignedRationalAxis, SignedRationalLocation, StrictRationalOrder} from '../../../types/problems.ts';
import {formatSignedRational as number} from './signed-meaning-helpers.ts';

const symbol = (relation: 'less' | 'equal' | 'greater') => relation === 'less' ? '<' : relation === 'greater' ? '>' : '=';
const vertical = (seed: number) => Math.abs(seed % 2) === 1;
function Card({title, children}: {title: string; children: ReactNode}) {
    return <main className="bg-white p-6 text-lg leading-relaxed text-slate-800" style={{width: 'min(800px, 100vw)'}}><h1 className="mb-4 text-2xl font-bold text-indigo-950">{title}</h1>{children}</main>;
}
function Answer({children}: {children: ReactNode}) {
    return <section className="mt-4 space-y-3 rounded-xl border border-emerald-400 bg-emerald-50 p-4 text-emerald-900" data-role="order-magnitude-answer">{children}</section>;
}
function Blank({children}: {children: ReactNode}) {
    return <section className="mt-4 space-y-4 rounded-xl border border-dashed border-slate-300 p-4" data-role="blank-order-magnitude-response">{children}<div className="h-8 border-b border-slate-300" /></section>;
}
/** Supplied indices determine positions. No magnitude, ordering result or distance is computed here. */
function ScalarLine({axis, marks, seed, distance, solution}: {axis: SignedRationalAxis; marks: readonly {label: string; location: SignedRationalLocation}[]; seed: number; distance?: RationalMagnitudeRelationProblem['distance']; solution: boolean}) {
    const upright = vertical(seed), labels = axis.ticks.map(value => number(value));
    const labelWidth = Math.max(...labels.map(label => label.length)) * 8, margin = Math.max(70, labelWidth / 2 + 20);
    const width = Math.max(740, upright ? labelWidth * 2 + 180 : (labels.length - 1) * Math.max(52, labelWidth + 18) + margin * 2);
    const height = upright ? Math.max(650, (labels.length - 1) * 44 + 130) : 240, center = width / 2;
    const x = (index: number) => upright ? center : margin + index * (width - margin * 2) / (labels.length - 1);
    const y = (index: number) => upright ? height - 80 - index * (height - 140) / (labels.length - 1) : 80;
    const combined = new Map<number, string[]>();
    for (const mark of marks) combined.set(mark.location.tickIndex, [...(combined.get(mark.location.tickIndex) ?? []), mark.label]);
    const segment = distance && distance.fromTickIndex !== distance.toTickIndex;
    const color = solution ? '#047857' : '#64748b';
    return <div className="mt-4 rounded-xl border border-slate-200 p-3"><svg viewBox={`0 0 ${width} ${height}`} style={{width: '100%', display: 'block'}} aria-label="Scaled number line" data-role="order-magnitude-line" data-orientation={upright ? 'vertical' : 'horizontal'}>
        <line x1={upright ? center : margin - 15} x2={upright ? center : width - margin + 15} y1={upright ? height - 65 : 80} y2={upright ? 43 : 80} stroke="#334155" strokeWidth="2" />
        {upright ? <polygon points={`${center},34 ${center - 5},45 ${center + 5},45`} fill="#334155" /> : <polygon points={`${width - margin + 24},80 ${width - margin + 13},75 ${width - margin + 13},85`} fill="#334155" />}
        {labels.map((label, index) => <g key={index}><line x1={x(index) - (upright ? 5 : 0)} x2={x(index) + (upright ? 5 : 0)} y1={y(index) - (upright ? 0 : 5)} y2={y(index) + (upright ? 0 : 5)} stroke="#334155" />
            <text x={x(index) - (upright ? 15 : 0)} y={y(index) + (upright ? 5 : 29)} textAnchor={upright ? 'end' : 'middle'} fontSize="14" fill="#334155" data-role="order-magnitude-tick">{label}</text></g>)}
        {[...combined].map(([index, ids]) => <g key={index} data-role="order-magnitude-marker"><circle cx={x(index)} cy={y(index)} r="5" fill="#3730a3" stroke="white" strokeWidth="1.5" />
            <text x={x(index) + (upright ? 18 : 0)} y={y(index) + (upright ? 5 : -18)} textAnchor={upright ? 'start' : 'middle'} fill="#3730a3" fontSize="16" fontWeight="700">{ids.join(' / ')}</text></g>)}
        {segment && <g data-role="absolute-distance-segment" stroke={color} strokeWidth="2">
            <line x1={upright ? center + 100 : x(distance.fromTickIndex)} x2={upright ? center + 100 : x(distance.toTickIndex)} y1={upright ? y(distance.fromTickIndex) : 150} y2={upright ? y(distance.toTickIndex) : 150} />
            {[distance.fromTickIndex, distance.toTickIndex].map((index, key) => <line key={key} x1={upright ? center + 92 : x(index)} x2={upright ? center + 108 : x(index)} y1={upright ? y(index) : 142} y2={upright ? y(index) : 158} />)}
        </g>}
        {segment && solution && <text x={upright ? center + 120 : (x(distance.fromTickIndex) + x(distance.toTickIndex)) / 2} y={upright ? (y(distance.fromTickIndex) + y(distance.toTickIndex)) / 2 + 5 : 184} fill="#047857" textAnchor={upright ? 'start' : 'middle'} fontSize="16" data-role="distance-length">{number(distance.length)}</text>}
        <text x={center} y={height - 16} textAnchor="middle" fill="#475569" fontSize="14">Step: {number(axis.step)}</text>
    </svg></div>;
}

export function InequalityLineBody({data, isSolutionView, seed}: {data: RationalOrderRelationProblem; isSolutionView: boolean; seed: number}) {
    const direction = vertical(seed) ? data.relation === 'less' ? 'below' : 'above' : data.relation === 'less' ? 'to the left of' : 'to the right of';
    return <Card title="Interpret the inequality on the line"><p data-role="given-inequality">A = {number(data.first.value)}; B = {number(data.second.value)}. Given: {number(data.first.value)} {symbol(data.relation)} {number(data.second.value)}.</p>
        <ScalarLine axis={data.axis} marks={[{label: 'A', location: data.first}, {label: 'B', location: data.second}]} seed={seed} solution={false} />
        <p className="mt-4">Explain what the inequality tells you about the positions of A and B.</p>
        {isSolutionView ? <Answer><p>A ({number(data.first.value)}) is {direction} B ({number(data.second.value)}). Values increase {vertical(seed) ? 'upward' : 'to the right'}.</p></Answer> : <Blank>Explanation: ____________________</Blank>}
    </Card>;
}

const language: Record<OrderedSignedContextMetadata['kind'], {unit: string; reference: string; framework: string; quantity: string}> = {
    temperature: {unit: '°C', reference: '0°C', framework: 'These Celsius temperatures use 0°C as the reference.', quantity: 'temperature'},
    elevation: {unit: 'm', reference: 'sea level', framework: 'These elevations are measured relative to sea level.', quantity: 'elevation'},
    balance: {unit: 'dollars', reference: 'a settled balance', framework: 'These net balances show available funds or amounts owed; zero is a settled balance.', quantity: 'net balance'}
};
function prose(context: OrderedSignedContextMetadata, observation: SignedContextObservation): string {
    const amount = number(observation.magnitude), positive = observation.sign === 1;
    if (observation.sign === 0) return context.kind === 'temperature' ? 'has a temperature at the 0°C reference' : context.kind === 'elevation' ? 'is at sea level' : 'has a settled balance, with no net funds available or owed';
    return context.kind === 'temperature' ? `has a temperature ${amount} degrees Celsius ${positive ? 'above' : 'below'} 0°C` : context.kind === 'elevation' ? `has an elevation ${amount} meters ${positive ? 'above' : 'below'} sea level` :
        positive ? `has ${amount} dollars of net funds available` : `owes ${amount} dollars`;
}
function ContextReadings({data}: {data: {context: OrderedSignedContextMetadata; first: SignedContextObservation; second: SignedContextObservation}}) {
    return <><p>{language[data.context.kind].framework}</p><div className="mt-4 space-y-2 rounded-lg bg-slate-100 p-4" data-role="context-readings">
        {[data.first, data.second].map(observation => <p key={observation.id}>{observation.id}: {number(observation.value)} {language[data.context.kind].unit}</p>)}
    </div></>;
}
function orderMeaning(context: OrderedSignedContextMetadata, relation: StrictRationalOrder): string {
    if (context.kind === 'temperature') return relation === 'less' ? 'colder than' : 'warmer than';
    return relation === 'less' ? 'lower than' : 'higher than';
}
function ContextInequality({first, second, relation}: {first: SignedContextObservation; second: SignedContextObservation; relation: StrictRationalOrder}) {
    return <p className="mt-4 font-mono" data-role="given-inequality">Given: {number(first.value)} {symbol(relation)} {number(second.value)} ({first.id} compared with {second.id}).</p>;
}
export function ContextOrderExplanationBody({data, isSolutionView}: {data: RationalOrderContextProblem; isSolutionView: boolean}) {
    return <Card title="Explain the contextual comparison"><ContextReadings data={data} /><ContextInequality first={data.first} second={data.second} relation={data.relation} />
        <p className="mt-4">Explain what this inequality means for {data.first.id} and {data.second.id} in this situation.</p>
        {isSolutionView ? <Answer><p>{data.first.id}'s {language[data.context.kind].quantity} is {orderMeaning(data.context, data.relation)} {data.second.id}'s. The signed values locate both quantities relative to {language[data.context.kind].reference}.</p></Answer> : <Blank>Explanation: ____________________</Blank>}
    </Card>;
}
export function ContextOrderWritingBody({data, isSolutionView}: {data: RationalOrderContextProblem; isSolutionView: boolean}) {
    return <Card title="Write an inequality from the context"><p>{language[data.context.kind].framework}</p><div className="mt-4 space-y-3 rounded-lg bg-slate-100 p-4" data-role="order-context-prose">
        {[data.first, data.second].map(observation => <p key={observation.id}>{observation.id} {prose(data.context, observation)}.</p>)}
        <p>{data.first.id}'s {language[data.context.kind].quantity} is {orderMeaning(data.context, data.relation)} {data.second.id}'s.</p>
    </div><p className="mt-4">Write the signed inequality, placing {data.first.id}'s value first. Include the common unit.</p>
        {isSolutionView ? <Answer><p className="font-mono">{number(data.first.value)} {symbol(data.relation)} {number(data.second.value)} {language[data.context.kind].unit}</p></Answer> : <Blank>Inequality: ____________________</Blank>}
    </Card>;
}
export function AbsoluteValueDistanceBody({data, isSolutionView, seed}: {data: RationalMagnitudeRelationProblem; isSolutionView: boolean; seed: number}) {
    const zeroPoint = data.point.tickIndex === data.axis.zeroIndex;
    return <Card title="Interpret absolute value as distance"><p>Given a = {number(data.point.value)}.</p>
        <ScalarLine axis={data.axis} marks={[{label: zeroPoint ? 'a / 0' : 'a', location: data.point}]} seed={seed} distance={data.distance} solution={isSolutionView} />
        <p className="mt-4">Write |a| and explain what it means as a distance from zero.</p>
        {isSolutionView ? <Answer><p className="font-mono">|{number(data.point.value)}| = {number(data.point.magnitude)}</p><p>{zeroPoint ? 'The point and zero coincide, so their distance is 0.' : `The distance from zero to a is ${number(data.distance.length)}.`} A distance is nonnegative. For nonzero values, the sign indicates the side of zero.</p></Answer> : <Blank><p>|{number(data.point.value)}| = __________</p><p>Meaning: ____________________</p></Blank>}
    </Card>;
}
export function ContextAbsoluteValueBody({data, isSolutionView}: {data: RationalMagnitudeContextProblem; isSolutionView: boolean}) {
    return <Card title="Write and interpret the absolute values"><ContextReadings data={data} /><ContextInequality first={data.first} second={data.second} relation={data.signedRelation} />
        <p className="mt-4">Write each absolute-value equation and explain its magnitude in this situation.</p>
        {isSolutionView ? <Answer>{[data.first, data.second].map(observation => <div key={observation.id} data-role="context-absolute-answer"><p className="font-mono">{observation.id}: |{number(observation.value)}| = {number(observation.magnitude)} {language[data.context.kind].unit}</p>
            <p>{data.context.kind === 'balance' ? `${observation.id} ${prose(data.context, observation)}.` : `${number(observation.magnitude)} ${language[data.context.kind].unit} is the distance from ${language[data.context.kind].reference}, without indicating direction.`}</p></div>)}
            <p data-role="magnitude-comparison">Magnitudes: {number(data.first.magnitude)} {symbol(data.magnitudeRelation)} {number(data.second.magnitude)}.</p>
        </Answer> : <Blank>{[data.first, data.second].map(observation => <p key={observation.id}>{observation.id}: absolute-value equation ____________________; meaning ____________________</p>)}</Blank>}
    </Card>;
}
export function OrderVersusMagnitudeBody({data, isSolutionView}: {data: RationalMagnitudeContextProblem; isSolutionView: boolean}) {
    return <Card title="Classify the two comparisons"><ContextReadings data={data} /><div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-4" data-role="comparison-statements">
        <p>Statement 1: {number(data.first.value)} {symbol(data.signedRelation)} {number(data.second.value)}</p>
        <p>Statement 2: |{number(data.first.value)}| {symbol(data.magnitudeRelation)} |{number(data.second.value)}|</p>
    </div><p className="mt-4">Classify what each statement compares. Explain how both statements describe these quantities.</p>
        {isSolutionView ? <Answer><p>Statement 1 compares signed {language[data.context.kind].quantity} values relative to {language[data.context.kind].reference}.</p>
            <p>Statement 2 compares absolute magnitudes: {number(data.first.magnitude)} {symbol(data.magnitudeRelation)} {number(data.second.magnitude)} {language[data.context.kind].unit}. These are nonnegative distances from the reference.</p>
            {data.context.kind === 'balance' && data.first.sign < 0 && data.second.sign < 0 ? <p>A lower signed balance means a larger amount owed. Both comparisons therefore hold.</p> : <p>Signed order includes direction; magnitude compares distance from the reference. The two statements compare different aspects of the same quantities.</p>}
        </Answer> : <Blank><p>Statement 1 compares ____________________.</p><p>Statement 2 compares ____________________.</p><p>Explanation: ____________________</p></Blank>}
    </Card>;
}
