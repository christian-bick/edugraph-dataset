import type {ReactNode} from 'react';
import type {RationalOppositeRelationProblem, SignedRationalAxis, SignedRationalLocation} from '../../../types/problems.ts';
import {formatSignedRational as numeral} from './signed-meaning-helpers.ts';

export type RationalOppositeTask = 'double-opposite' | 'opposite-locations' | 'zero-opposite';
function Solution({children}: {children: ReactNode}) {
    return <section data-role="solution" className="mt-4 space-y-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-lg leading-relaxed text-emerald-900">{children}</section>;
}
function Response() {
    return <section data-role="blank-response" className="mt-4 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-600"><p>Explanation: __________________________________________________</p><div className="mt-8 border-b border-slate-300" /></section>;
}

/** Tick indices, not rounded numerical values, determine every drawn location. */
function Axis({axis, points, vertical}: {axis: SignedRationalAxis; points: readonly {name: string; tickIndex: number}[]; vertical: boolean}) {
    const width = vertical ? 320 : 700;
    const height = vertical ? 410 : 190;
    const coordinate = (index: number) => vertical ? 350 - index * 280 / (axis.ticks.length - 1) : 40 + index * 620 / (axis.ticks.length - 1);
    return <svg data-role="number-line" data-orientation={vertical ? 'vertical' : 'horizontal'} viewBox={`0 0 ${width} ${height}`} style={{width: '100%', height: vertical ? 410 : 190}} aria-label={`Exact number line; values increase ${vertical ? 'upward' : 'to the right'}`}>
        <text x={width / 2} y={24} textAnchor="middle" fill="#475569" fontSize="14">Values increase {vertical ? 'upward' : 'to the right'}</text>
        {vertical ? <><line x1="142" y1="368" x2="142" y2="48" stroke="#334155" strokeWidth="2" /><polygon points="142,42 137,52 147,52" fill="#334155" /></> :
            <><line x1="22" y1="100" x2="678" y2="100" stroke="#334155" strokeWidth="2" /><polygon points="685,100 675,95 675,105" fill="#334155" /></>}
        {axis.ticks.map((tick, index) => <g key={index} data-tick-index={index}>
            {vertical ? <><line x1="136" y1={coordinate(index)} x2="148" y2={coordinate(index)} stroke="#64748b" /><text x="126" y={coordinate(index) + 5} textAnchor="end" fill="#334155" fontSize="14">{numeral(tick, true)}</text></> :
                <><line x1={coordinate(index)} y1="94" x2={coordinate(index)} y2="106" stroke="#64748b" /><text x={coordinate(index)} y="130" textAnchor="middle" fill="#334155" fontSize="14">{numeral(tick, true)}</text></>}
        </g>)}
        {points.map(point => <g key={point.name} data-point={point.name} data-tick-index={point.tickIndex}>
            <circle cx={vertical ? 142 : coordinate(point.tickIndex)} cy={vertical ? coordinate(point.tickIndex) : 100} r="5" fill="#3730a3" />
            <text x={vertical ? 160 : coordinate(point.tickIndex)} y={vertical ? coordinate(point.tickIndex) + 5 : 78} textAnchor={vertical ? 'start' : 'middle'} fill="#312e81" fontSize="16" fontWeight="700">{point.name}</text>
        </g>)}
    </svg>;
}
function PairDiagram({title, axis, negative, positive, vertical}: {title: string; axis: SignedRationalAxis; negative: SignedRationalLocation; positive: SignedRationalLocation; vertical: boolean}) {
    return <section className="rounded-xl border border-slate-200 p-3" data-role="signed-pair">
        <h2 className="text-center text-base font-semibold">{title}</h2>
        <p className="mt-2 text-center font-mono">A = {numeral(negative.value, true)}; B = {numeral(positive.value, true)}</p>
        <Axis axis={axis} points={[{name: 'A', tickIndex: negative.tickIndex}, {name: 'B', tickIndex: positive.tickIndex}]} vertical={vertical} />
    </section>;
}
export function RationalOppositeBody({data, task, isSolutionView, seed}: {data: RationalOppositeRelationProblem; task: RationalOppositeTask; isSolutionView: boolean; seed: number}) {
    const vertical = Math.abs(seed % 2) === 1;
    const title = task === 'double-opposite' ? 'The opposite of an opposite' : task === 'zero-opposite' ? 'The opposite of zero' : 'Signs and positions';
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-800 shadow-sm" style={{width: 790, maxWidth: '95vw'}}>
        <h1 className="mb-3 text-2xl font-bold text-indigo-950">{title}</h1>
        {task === 'double-opposite' ? <>
            <div className="space-y-3 rounded-xl bg-slate-100 p-4 text-xl" data-role="two-opposite-steps">
                <p>Starting value: <strong className="font-mono">{numeral(data.original.value, true)}</strong></p>
                <p className="font-mono">First opposite: -({numeral(data.original.value, true)}) = {numeral(data.opposite.value, true)}</p>
                <p className="font-mono">Second opposite: -({numeral(data.opposite.value, true)}) = {numeral(data.doubleOpposite.value, true)}</p>
            </div>
            <p className="mt-3 text-base text-slate-600" data-role="reference-values">Reference {data.original.sign === 0 ? 'values' : 'value'}: {data.original.sign === 0 && <span className="font-mono">{numeral(data.oppositePair.negative.value)}; </span>}<span className="font-mono">{numeral(data.zeroFixedPoint.value)}</span>{data.original.sign === 0 && <span className="font-mono">; {numeral(data.oppositePair.positive.value, true)}</span>}</p>
            <p className="mt-4 text-lg">Explain how taking the opposite twice affects the starting value.</p>
            {isSolutionView ? <Solution><p>The second opposite returns to the starting value, <strong>{numeral(data.doubleOpposite.value, true)}</strong>.</p><p>{data.original.sign === 0 ? 'Both opposite steps leave zero unchanged.' : 'The first step changes the sign; the second step changes it back.'}</p></Solution> : <Response />}
        </> : task === 'opposite-locations' ? <>
            <p className="mb-4 text-lg">Interpret the signs and positions in each pair. Does having unlike signs always mean the same distance from zero?</p>
            <div style={{display: 'grid', gridTemplateColumns: vertical ? '1fr 1fr' : '1fr', gap: 12}}>
                <PairDiagram title="Pair 1" axis={data.axis} negative={data.oppositePair.negative} positive={data.oppositePair.positive} vertical={vertical} />
                <PairDiagram title="Pair 2" axis={data.axis} negative={data.unequalSignedPair.negative} positive={data.unequalSignedPair.positive} vertical={vertical} />
            </div>
            {isSolutionView ? <Solution><p>In each pair, A is negative and lies {vertical ? 'below' : 'left of'} zero; B is positive and lies {vertical ? 'above' : 'right of'} zero.</p>
                <p>Pair 1 is an opposite pair: both distances from zero are {numeral(data.oppositePair.commonMagnitude)}.</p>
                <p>Pair 2 has distances {numeral(data.unequalSignedPair.negative.magnitude)} and {numeral(data.unequalSignedPair.positive.magnitude)}. They are unequal, so unlike signs alone do not mean equal distances.</p></Solution> : <Response />}
        </> : <>
            <p className="text-lg">Explain why zero is its own opposite, using the position shown.</p>
            <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <p className="text-center font-mono text-xl" data-role="zero-relation">-({numeral(data.zeroFixedPoint.value)}) = {numeral(data.zeroFixedPoint.opposite)}</p>
                <p className="mt-2 text-center text-base">Z marks zero and its opposite.</p>
                <Axis axis={data.axis} points={[{name: 'Z', tickIndex: data.zeroFixedPoint.tickIndex}]} vertical={vertical} />
            </div>
            {isSolutionView ? <Solution><p>Zero and its opposite occupy the same position. Reflection about zero leaves this point unchanged, so -0 = 0.</p></Solution> : <Response />}
        </>}
    </main>;
}
