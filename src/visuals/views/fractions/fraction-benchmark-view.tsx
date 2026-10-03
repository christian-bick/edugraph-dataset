import type {
    FractionBenchmarkArithmeticProblem,
    FractionBenchmarkOperand,
    FractionBenchmarkRational
} from '../../../types/problems.ts';
import {formatBenchmarkFraction, formatQuarterTick} from './fraction-benchmark-helpers.ts';

export type FractionBenchmarkTask = 'estimate' | 'reasonableness';
interface Props {
    data: FractionBenchmarkArithmeticProblem;
    isSolutionView: boolean;
    task: FractionBenchmarkTask;
}

const symbol = (operation: FractionBenchmarkArithmeticProblem['operation']): string =>
    operation === 'addition' ? '+' : '−';

const fractionX = (value: FractionBenchmarkRational): number =>
    80 + 560 * value.numerator / value.denominator;
const tickX = (tick: number): number => 80 + 140 * tick;

function BenchmarkNumberLine({first, second}: {
    first: FractionBenchmarkOperand;
    second: FractionBenchmarkOperand;
}) {
    return <svg viewBox="0 0 720 190" className="h-[190px] w-[720px]" role="img"
        aria-label="Two aligned fraction number lines share the same whole from zero to one, marked at each quarter">
        <rect width="720" height="190" rx="18" fill="#f8fafc" />
        {[first, second].map((operand, index) => {
            const y = index === 0 ? 58 : 123;
            const left = tickX(operand.lowerTick);
            const right = tickX(operand.upperTick);
            return <g key={index}>
                <text x="25" y={y + 6} className="fill-slate-700 text-[16px] font-bold">{index === 0 ? 'A' : 'B'}</text>
                <rect x={left - (left === right ? 6 : 0)} y={y - 16}
                    width={Math.max(12, right - left)} height="32" rx="8" fill="#bfdbfe" opacity="0.75" />
                <line x1="80" y1={y} x2="640" y2={y} stroke="#334155" strokeWidth="3" />
                {[0, 1, 2, 3, 4].map(tick => <line key={tick} x1={tickX(tick)} y1={y - 7}
                    x2={tickX(tick)} y2={y + 7} stroke="#475569" strokeWidth="2" />)}
                <circle cx={fractionX(operand.value)} cy={y} r="7" fill={index === 0 ? '#4f46e5' : '#059669'}
                    stroke="#ffffff" strokeWidth="2" />
                <text x={fractionX(operand.value)} y={y - 25} textAnchor="middle"
                    className={`text-[15px] font-bold ${index === 0 ? 'fill-indigo-800' : 'fill-emerald-800'}`}>
                    {formatBenchmarkFraction(operand.value)}
                </text>
            </g>;
        })}
        {[0, 1, 2, 3, 4].map(tick => <text key={tick} x={tickX(tick)} y="175" textAnchor="middle"
            className="fill-slate-700 text-[14px] font-semibold">{formatQuarterTick(tick)}</text>)}
    </svg>;
}

function OperandEvidence({operand, label}: {operand: FractionBenchmarkOperand; label: string}) {
    const relation = operand.relationToHalf === 'less' ? 'below'
        : operand.relationToHalf === 'greater' ? 'above' : 'at';
    return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800">
        <strong>{label}: {formatBenchmarkFraction(operand.value)}</strong> is {relation} 1/2 and lies from
        {' '}{formatQuarterTick(operand.lowerTick)} to {formatQuarterTick(operand.upperTick)} on the same whole.
    </div>;
}

function BoundWork({data}: {data: FractionBenchmarkArithmeticProblem}) {
    const first = data.first;
    const second = data.second;
    const add = data.operation === 'addition';
    const lowerSecond = add ? second.lowerTick : second.upperTick;
    const upperSecond = add ? second.upperTick : second.lowerTick;
    const sign = symbol(data.operation);
    return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <div className="font-bold">Combine the quarter bounds</div>
        <div className="mt-1 font-mono">
            Lower: {formatQuarterTick(first.lowerTick)} {sign} {formatQuarterTick(lowerSecond)} = {formatBenchmarkFraction(data.resultBounds.lower)}
        </div>
        <div className="font-mono">
            Upper: {formatQuarterTick(first.upperTick)} {sign} {formatQuarterTick(upperSecond)} = {formatBenchmarkFraction(data.resultBounds.upper)}
        </div>
        <div className="mt-1 font-semibold">
            The result lies from {formatBenchmarkFraction(data.resultBounds.lower)} to {formatBenchmarkFraction(data.resultBounds.upper)}.
        </div>
    </div>;
}

function EstimateAnswer({data, isSolutionView}: Omit<Props, 'task'>) {
    if (!isSolutionView) return <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-lg font-semibold text-slate-600">
        Benchmark interval for the result: from ______ to ______
    </div>;
    const approximation = data.approximation;
    return <div className="mt-3 space-y-2">
        <BoundWork data={data} />
        {approximation && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
            <div className="font-bold">A nearest-quarter estimate</div>
            <div className="mt-1 font-mono font-semibold">
                {formatBenchmarkFraction(data.first.value)} ≈ {formatQuarterTick(approximation.firstTick)};
                {' '}{formatBenchmarkFraction(data.second.value)} ≈ {formatQuarterTick(approximation.secondTick)}
            </div>
            <div className="mt-1 font-mono font-bold">
                {formatQuarterTick(approximation.firstTick)} {symbol(data.operation)} {formatQuarterTick(approximation.secondTick)}
                {' '}≈ {formatBenchmarkFraction(approximation.estimatedResult)}
            </div>
        </div>}
    </div>;
}

function ReasonablenessAnswer({data, isSolutionView}: Omit<Props, 'task'>) {
    const candidate = formatBenchmarkFraction(data.candidate.value);
    return <div className="mt-4">
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-lg text-slate-800">
            Proposed result: <strong className="font-mono">{formatBenchmarkFraction(data.first.value)} {symbol(data.operation)} {formatBenchmarkFraction(data.second.value)} = {candidate}</strong>
        </div>
        {isSolutionView
            ? <div className="mt-3 space-y-3">
                <BoundWork data={data} />
                <div className={`rounded-xl border-2 p-4 text-base font-semibold ${data.candidate.judgment === 'reasonable'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                    : 'border-rose-400 bg-rose-50 text-rose-950'}`}>
                    {data.candidate.judgment === 'reasonable'
                        ? `Reasonable: ${candidate} is within these benchmark bounds.`
                        : `Unreasonable: ${candidate} is outside these benchmark bounds.`}
                </div>
            </div>
            : <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-base font-semibold text-slate-600">
                Reasonable or unreasonable? ______ &nbsp; Explain using the benchmark bounds: ____________________
            </div>}
    </div>;
}

export function FractionBenchmarkBody({data, isSolutionView, task}: Props) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm"
        style={{width: 820, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Same-whole fraction benchmarks</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {task === 'estimate' ? 'Estimate with quarter benchmarks' : 'Judge a proposed result'}
        </h1>
        <p className="mt-2 text-base text-slate-700">
            {task === 'estimate'
                ? 'Use the quarter benchmarks to give an interval for the sum or difference. Find the lower and upper possible benchmark values.'
                : 'Decide whether the proposed result is reasonable. Justify your decision with the quarter benchmarks.'}
        </p>
        <div className="mt-3 text-center font-mono text-2xl font-bold text-slate-900">
            {formatBenchmarkFraction(data.first.value)} {symbol(data.operation)} {formatBenchmarkFraction(data.second.value)}
        </div>
        <div className="mt-3 flex justify-center"><BenchmarkNumberLine first={data.first} second={data.second} /></div>
        <div className="mt-2 text-center text-sm font-semibold text-slate-600">Both number lines measure parts of the same whole.</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
            <OperandEvidence operand={data.first} label="A" />
            <OperandEvidence operand={data.second} label="B" />
        </div>
        {task === 'estimate'
            ? <EstimateAnswer data={data} isSolutionView={isSolutionView} />
            : <ReasonablenessAnswer data={data} isSolutionView={isSolutionView} />}
    </main>;
}
