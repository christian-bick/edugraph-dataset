import type {FractionQuotientProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {formatOriginalFraction, formatQuotientValue, measure} from './fraction-quotient-helpers.ts';

export type FractionQuotientTask = 'quotient-interpretation' | 'division-interpretation'
    | 'division-execution' | 'division-story-creation' | 'division-inverse-explanation'
    | 'division-word-problem';

interface Props {
    data: FractionQuotientProblem;
    isSolutionView: boolean;
    task: FractionQuotientTask;
}

const naturalNumber = (value: number, singular: string, plural: string): string =>
    `${value} ${value === 1 ? singular : plural}`;

const expression = (data: FractionQuotientProblem): string =>
    `${formatQuotientValue(data.dividend)} ÷ ${formatQuotientValue(data.divisor)}`;

const displayedQuotient = (data: FractionQuotientProblem): string =>
    data.orientation === 'whole-by-whole'
        ? formatOriginalFraction(data.quotient)
        : formatQuotientValue(data.quotient);

function storyQuestion(data: FractionQuotientProblem): string {
    const material = data.story.material;
    if (data.orientation === 'whole-by-unit-fraction') {
        const length = measure(data.dividend);
        return data.model.wholeUnitCount === 0
            ? `There are ${length} of ${material} to cut into ${formatQuotientValue(data.divisor)}-meter pieces. How many pieces can be made?`
            : `A ${material} measures ${length}. It is cut into pieces that are each ${measure(data.divisor)} long. How many pieces can be made?`;
    }
    const length = measure(data.dividend);
    return data.dividend.numerator === 0
        ? `There are ${length} of ${material} to share equally among ${naturalNumber(data.divisor.numerator, 'person', 'people')}. How many meters does each person receive?`
        : `A ${material} measures ${length}. It is shared equally among ${naturalNumber(data.divisor.numerator, 'person', 'people')}. How many meters does each person receive?`;
}

const answerWithUnit = (data: FractionQuotientProblem): string =>
    data.orientation === 'whole-by-unit-fraction'
        ? naturalNumber(data.quotient.numerator, 'piece', 'pieces')
        : data.orientation === 'whole-by-whole'
            ? `${displayedQuotient(data)} ${data.quotient.numerator > 0 && data.quotient.numerator <= data.quotient.denominator ? 'meter' : 'meters'}`
            : measure(data.quotient);

function Model({data}: {data: FractionQuotientProblem}) {
    const x = 100;
    const width = 570;
    const y0 = 39;
    if (data.orientation === 'unit-fraction-by-whole') {
        const base = data.model.wholePartitionCount;
        const fine = data.model.refinedPartitionCount;
        return <svg viewBox="0 0 760 195" className="h-[195px] w-[760px] max-w-full" role="img"
            aria-label="One whole partitioned into equal parts, with one part shared again equally">
            <text x="22" y="29" className="fill-slate-700 text-[15px] font-bold">One meter</text>
            {Array.from({length: base}, (_, index) => <rect key={`base-${index}`}
                x={x + index * width / base} y="42" width={width / base} height="42"
                fill={index === 0 ? '#bfdbfe' : '#f1f5f9'} stroke="#334155" strokeWidth="2" />)}
            <text x="22" y="117" className="fill-slate-700 text-[15px] font-bold">Shared part</text>
            {Array.from({length: fine}, (_, index) => <g key={`fine-${index}`}>
                <rect x={x + index * width / fine} y="128" width={width / fine} height="42"
                    fill={index < data.model.recipientCount
                        ? ['#bfdbfe', '#bbf7d0', '#fde68a', '#fecaca', '#ddd6fe', '#fed7aa'][index]
                        : '#f1f5f9'}
                    stroke="#475569" strokeWidth="1.5" />
                {index < data.model.recipientCount && <text
                    x={x + (index + 0.5) * width / fine} y="154" textAnchor="middle"
                    className="fill-slate-900 text-[10px] font-bold">{index + 1}</text>}
            </g>)}
            <line x1={x + width / (2 * base)} y1="89" x2={x + width / (2 * base)} y2="123"
                stroke="#64748b" strokeWidth="2" />
            <text x="380" y="189" textAnchor="middle" className="fill-slate-600 text-[13px]">
                Numbered fine parts go to different people; all cuts use the same one-meter whole.
            </text>
        </svg>;
    }

    const count = data.model.wholeUnitCount;
    const parts = data.model.partsPerWhole;
    if (count === 0) return <div className="flex h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-lg text-slate-600">
        0 meters: no unit parts to {data.orientation === 'whole-by-unit-fraction' ? 'count' : 'share'}.
    </div>;

    return <svg viewBox="0 0 760 235" className="h-[235px] w-[760px] max-w-full" role="img"
        aria-label="Whole measured lengths partitioned into equal unit parts">
        <text x="24" y="28" className="fill-slate-700 text-[15px] font-bold">
            {data.orientation === 'whole-by-whole' ? 'Equal shares by person' : 'Equal-sized pieces'}
        </text>
        {Array.from({length: count}, (_, row) => <g key={row}>
            <text x="22" y={y0 + row * 30 + 19} className="fill-slate-600 text-[14px]">
                {row + 1} m
            </text>
            {Array.from({length: parts}, (_, index) => <g key={index}>
                <rect x={x + index * width / parts} y={y0 + row * 30}
                    width={width / parts} height="24"
                    fill={data.orientation === 'whole-by-whole'
                        ? ['#bfdbfe', '#bbf7d0', '#fde68a', '#fecaca', '#ddd6fe', '#fed7aa'][index]
                        : '#c7d2fe'}
                    stroke="#475569" strokeWidth="1.5" />
                {data.orientation === 'whole-by-whole' && <text x={x + (index + 0.5) * width / parts}
                    y={y0 + row * 30 + 17} textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">
                    P{index + 1}
                </text>}
            </g>)}
        </g>)}
        <text x="380" y="231" textAnchor="middle" className="fill-slate-600 text-[13px]">
            {data.orientation === 'whole-by-whole'
                ? `Each meter is cut into ${parts} equal shares.`
                : `Each meter is cut into ${parts} equal unit-fraction pieces.`}
        </text>
    </svg>;
}

function modelExplanation(data: FractionQuotientProblem): string {
    if (data.orientation === 'whole-by-whole') {
        return `${data.model.wholeUnitCount} whole meters are split among ${data.model.recipientCount} people. Each person gets ${data.model.partsPerRecipient} parts of size 1/${data.model.partsPerWhole} meter, or ${answerWithUnit(data)}.`;
    }
    if (data.orientation === 'unit-fraction-by-whole') {
        return `The ${measure(data.dividend)} amount is split equally among ${data.model.recipientCount} people. The whole has ${data.model.refinedPartitionCount} equal fine parts; each person gets one, or ${answerWithUnit(data)}.`;
    }
    return `${data.model.wholeUnitCount} whole meters contain ${data.model.groupCount} parts of size ${measure(data.divisor)}. The quotient counts ${answerWithUnit(data)}.`;
}

function NotationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    const fraction: FractionQuotientValue = data.quotient;
    const notation = formatOriginalFraction(fraction);
    return <>
        <p className="text-base text-slate-700">Explain what the numerator and denominator mean when this fraction is read as division.</p>
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-center font-mono text-2xl font-bold text-indigo-950">
            {notation} &nbsp; and &nbsp; {fraction.numerator} ÷ {fraction.denominator}
        </div>
        {data.orientation === 'whole-by-whole'
            ? <div className="mt-4"><Model data={data} /></div>
            : <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-base text-slate-700">
                Original division: <span className="font-mono font-bold">{expression(data)}</span>
            </div>}
        {isSolutionView ? <Answer>
            {data.orientation === 'whole-by-whole'
                ? <>{notation} means {fraction.numerator} whole {fraction.numerator === 1 ? 'unit' : 'units'} divided among {fraction.denominator} equal {fraction.denominator === 1 ? 'recipient' : 'recipients'}.
                    {' '}Each share is {notation} of one unit, so {fraction.numerator} ÷ {fraction.denominator} = {notation}.</>
                : <>The original division gives {answerWithUnit(data)}. As a number, {notation} means {fraction.numerator} divided into {fraction.denominator} equal {fraction.denominator === 1 ? 'group' : 'groups'};
                    {' '}{fraction.numerator} ÷ {fraction.denominator} = {notation}. This notation gives the same quotient value while the original division determines what it measures or counts.</>}
        </Answer> : <Blank>What does the fraction mean as equal sharing? ____________________</Blank>}
    </>;
}

function InterpretationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="text-base text-slate-700">Interpret the division: what is being shared or counted, and what does its quotient mean?</p>
        <Expression data={data} showAnswer={isSolutionView} />
        <div className="mt-4"><Model data={data} /></div>
        {isSolutionView ? <Answer>{modelExplanation(data)}</Answer>
            : <Blank>The quotient measures or counts ____________________</Blank>}
    </>;
}

function ExecutionTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="text-base text-slate-700">Use the equal parts in the model to find the quotient.</p>
        <Expression data={data} showAnswer={isSolutionView} />
        <div className="mt-4"><Model data={data} /></div>
        {isSolutionView && <Answer>{modelExplanation(data)}</Answer>}
    </>;
}

function StoryCreationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="text-base text-slate-700">Write a {data.story.material} story that matches this division. Make the original quantities and the question clear.</p>
        <Expression data={data} showAnswer={isSolutionView} />
        <div className="mt-4"><Model data={data} /></div>
        {isSolutionView ? <Answer>Example story: {storyQuestion(data)} The answer is {answerWithUnit(data)}.</Answer>
            : <Blank>My story: ____________________________________________________</Blank>}
    </>;
}

function InverseTask({data, isSolutionView}: Omit<Props, 'task'>) {
    const quotient = displayedQuotient(data);
    const divisor = formatQuotientValue(data.divisor);
    const dividend = formatQuotientValue(data.dividend);
    return <>
        <p className="text-base text-slate-700">Explain why multiplication by the original divisor rebuilds the original amount.</p>
        <Expression data={data} showAnswer />
        <div className="mt-4"><Model data={data} /></div>
        {isSolutionView ? <Answer>
            <div className="font-mono font-bold">{quotient} × {divisor}
                {data.multiplicationWitness && <> = {formatOriginalFraction(data.multiplicationWitness.unreducedProduct)}</>}
                {' '}= {dividend}</div>
            <div className="mt-2">{data.orientation === 'whole-by-unit-fraction'
                ? `${answerWithUnit(data)} of ${measure(data.divisor)} each rebuild ${measure(data.dividend)}.`
                : `${data.divisor.numerator} equal shares of ${measure(data.quotient)} each rebuild ${measure(data.dividend)}.`}</div>
        </Answer> : <Blank>{quotient} × {divisor} = ______ &nbsp; Why? ____________________</Blank>}
    </>;
}

function WordProblemTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="rounded-xl bg-indigo-50 p-5 text-lg leading-relaxed text-indigo-950">{storyQuestion(data)}</p>
        {isSolutionView ? <>
            <div className="mt-4"><Model data={data} /></div>
            <Answer>
                <div className="font-mono font-bold">{expression(data)} = {displayedQuotient(data)}</div>
                <div className="mt-2">{modelExplanation(data)}</div>
                {data.equationWitness && <div className="mt-2 font-mono">
                    {formatQuotientValue(data.equationWitness.groupCount)} × {formatQuotientValue(data.equationWitness.measurePerGroup)}
                    {' '}= {formatQuotientValue(data.equationWitness.totalMeasure)}
                </div>}
            </Answer>
        </> : <Blank>Equation: ____________________ &nbsp; Answer with units: ____________________</Blank>}
    </>;
}

function Expression({data, showAnswer}: {data: FractionQuotientProblem; showAnswer: boolean}) {
    return <div className="mt-4 rounded-xl bg-slate-100 p-4 text-center font-mono text-2xl font-bold text-slate-900">
        {expression(data)} = {showAnswer ? displayedQuotient(data) : '______'}
    </div>;
}

const Answer = ({children}: {children: React.ReactNode}) =>
    <div className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-base leading-relaxed text-emerald-950">{children}</div>;
const Blank = ({children}: {children: React.ReactNode}) =>
    <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-base font-semibold text-slate-600">{children}</div>;

const titles: Record<FractionQuotientTask, string> = {
    'quotient-interpretation': 'A fraction is a quotient',
    'division-interpretation': 'What does the quotient mean?',
    'division-execution': 'Find the quotient',
    'division-story-creation': 'Create a division story',
    'division-inverse-explanation': 'Explain with multiplication',
    'division-word-problem': 'Solve a division story'
};

export function FractionQuotientBody({data, isSolutionView, task}: Props) {
    const common = {data, isSolutionView};
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm"
        style={{width: 850, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Exact fraction division</div>
        <h1 className="mb-3 mt-2 text-2xl font-bold">{titles[task]}</h1>
        {task === 'quotient-interpretation' ? <NotationTask {...common} />
            : task === 'division-interpretation' ? <InterpretationTask {...common} />
                : task === 'division-execution' ? <ExecutionTask {...common} />
                    : task === 'division-story-creation' ? <StoryCreationTask {...common} />
                        : task === 'division-inverse-explanation' ? <InverseTask {...common} />
                            : <WordProblemTask {...common} />}
    </main>;
}
