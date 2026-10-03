import type {FractionScaleComparisonProblem} from '../../../types/problems.ts';
import {formatOriginalScaleFraction, formatScaleRational} from './fraction-scale-comparison-helpers.ts';

export type FractionScaleTask = 'comparison' | 'explanation';

interface Props {
    data: FractionScaleComparisonProblem;
    task: FractionScaleTask;
    isSolutionView: boolean;
}

const symbol: Record<FractionScaleComparisonProblem['relation'], string> = {
    greater: '>', less: '<', equal: '='
};

const relationWords: Record<FractionScaleComparisonProblem['relation'], string> = {
    greater: 'greater than', less: 'less than', equal: 'equal to'
};

function EqualParts({data}: {data: FractionScaleComparisonProblem}) {
    const {numerator: selectedParts, denominator: referenceParts} = data.scaleFactor;
    const unitWidth = 590 / Math.max(selectedParts, referenceParts);
    const x = 126;
    const upperY = 44;
    const lowerY = 111;
    return <svg viewBox="0 0 760 174" className="block h-[174px] w-[760px] max-w-full"
        role="img" aria-label={`Two bars use the same equal-part width: the reference has ${referenceParts} parts and its scaled value has ${selectedParts} parts`}>
        <rect width="760" height="174" rx="12" fill="#f8fafc" />
        <text x="12" y={upperY + 25} className="fill-slate-700 text-[15px] font-bold">Reference</text>
        <text x="12" y={lowerY + 25} className="fill-slate-700 text-[15px] font-bold">Scaled</text>
        {Array.from({length: referenceParts}, (_, index) => <rect key={`reference-${index}`}
            x={x + index * unitWidth} y={upperY} width={unitWidth} height="40"
            fill="#dbeafe" stroke="#475569" strokeWidth="1.5" />)}
        {Array.from({length: selectedParts}, (_, index) => <rect key={`scaled-${index}`}
            x={x + index * unitWidth} y={lowerY} width={unitWidth} height="40"
            fill="#bbf7d0" stroke="#475569" strokeWidth="1.5" />)}
        <text x={x} y="28" className="fill-slate-600 text-[14px]">
            Every section is one equal part of {formatScaleRational(data.reference)}: {formatScaleRational(data.onePart)}.
        </text>
    </svg>;
}

function Analogy({data}: {data: FractionScaleComparisonProblem}) {
    const q = formatScaleRational(data.reference);
    const twice = formatScaleRational(data.wholeNumberAnalogy.product);
    return <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-[17px] leading-relaxed text-indigo-950">
        Familiar whole-number scaling: multiplying {q} by 2 gives {twice}, and {twice} &gt; {q}.
    </div>;
}

function Solution({data, task}: {data: FractionScaleComparisonProblem; task: FractionScaleTask}) {
    const q = formatScaleRational(data.reference);
    const factor = formatOriginalScaleFraction(data.scaleFactor);
    const {numerator: a, denominator: b} = data.scaleFactor;
    return <div className="space-y-3">
        <EqualParts data={data} />
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3 text-[17px] leading-relaxed text-emerald-950">
            <div>{q} ÷ {b} = {formatScaleRational(data.onePart)}. The reference is {b} equal parts; multiplying by {factor} selects {a} of those same parts.</div>
            <div>{a} {symbol[data.relation]} {b}, so {factor} {symbol[data.relation]} 1.</div>
            <div className="font-bold">{q} × {factor} {symbol[data.relation]} {q}.</div>
            {task === 'explanation' && <div>Because {a} parts are {relationWords[data.relation]} {b} parts, multiplying {q} by {factor} makes a quantity {relationWords[data.relation]} {q}.</div>}
        </div>
        {task === 'explanation' && <Analogy data={data} />}
    </div>;
}

export function FractionScaleComparisonBody({data, task, isSolutionView}: Props) {
    const q = formatScaleRational(data.reference);
    const factor = formatOriginalScaleFraction(data.scaleFactor);
    return <main className="w-[820px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-[23px] font-bold leading-snug text-slate-900">
            {task === 'comparison'
                ? 'Without finding the exact product, compare it with the original quantity.'
                : 'Explain why multiplying by this fraction changes the original quantity as it does.'}
        </h1>
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-6 py-4 text-center text-[26px] font-bold text-violet-950">
            Original: {q} &nbsp; · &nbsp; Factor: {factor}
        </div>
        <div className="mt-4 text-center text-[24px] font-semibold text-slate-900">
            {q} × {factor} {isSolutionView ? symbol[data.relation] : '□'} {q}
        </div>
        {task === 'explanation' && !isSolutionView && <div className="mt-4"><Analogy data={data} /></div>}
        <div className="mt-4">
            {isSolutionView
                ? <Solution data={data} task={task} />
                : <div className="rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-[17px] leading-relaxed text-slate-700">
                    {task === 'comparison'
                        ? 'Choose >, <, or =. Explain how the fraction factor compares with 1: ____________________'
                        : 'Compare the fraction factor with 1. Explain in words how equal parts show whether the product grows or shrinks: ____________________'}
                </div>}
        </div>
    </main>;
}
