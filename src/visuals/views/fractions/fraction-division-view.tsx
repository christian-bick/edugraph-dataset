import type {ReactNode} from 'react';
import type {FractionDivisionRelationProblem} from '../../../types/problems.ts';
import {
    divisionFactor, divisionNumber, fractionDivisionAnswerUnit, fractionDivisionMeaning,
    fractionDivisionStory, originalDivisionFraction, originalDivisionOperand
} from './fraction-division-helpers.ts';

export type GeneralFractionDivisionTask = 'division-execution' | 'division-interpretation'
    | 'division-inverse-explanation' | 'division-story-creation' | 'division-word-problem'
    | 'division-model-construction';

type TaskProps = {data: FractionDivisionRelationProblem; isSolutionView: boolean};

const titles: Record<GeneralFractionDivisionTask, string> = {
    'division-execution': 'Divide fractions exactly',
    'division-interpretation': 'Interpret a fraction quotient',
    'division-inverse-explanation': 'Explain fraction division with multiplication',
    'division-story-creation': 'Create a fraction-division story',
    'division-word-problem': 'Solve a fraction-division story',
    'division-model-construction': 'Construct a fraction-division model'
};

function Answer({children}: {children: ReactNode}) {
    return <section className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-lg leading-relaxed text-emerald-950">{children}</section>;
}

function Blank({children}: {children: ReactNode}) {
    return <section className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-lg text-slate-700">{children}</section>;
}

/** A font-independent response box; the square Unicode glyph uses an unpinned system fallback. */
function AnswerBlank() {
    return <span role="img" aria-label="Unresolved value" data-response="answer-blank" style={{
        display: 'inline-block', width: '0.65em', height: '0.65em', border: '1px solid currentColor',
        boxSizing: 'border-box', verticalAlign: '-0.025em'
    }} />;
}

function DivisionExpression({data, showQuotient, solution}: {data: FractionDivisionRelationProblem; showQuotient: boolean; solution: boolean}) {
    return <div className="my-4 rounded-xl bg-slate-100 p-4 text-center font-mono text-2xl font-semibold">
        {divisionFactor(data.dividend)} ÷ {divisionFactor(data.divisor)} ={' '}
        <span className={solution ? 'font-bold text-emerald-800' : ''}>{showQuotient ? divisionNumber(data.quotient) : <AnswerBlank />}</span>
    </div>;
}

function ModelSummary({data}: {data: FractionDivisionRelationProblem}) {
    const {completeGroups, remainderTicks, divisorTicks, fractionalGroup} = data.model;
    return <p>The numerical model has {completeGroups} complete divisor-sized {completeGroups === 1 ? 'group' : 'groups'}
        {remainderTicks > 0 && <> and {divisionNumber(fractionalGroup)} of another group ({remainderTicks} of its {divisorTicks} equal ticks)</>}.
        {' '}The exact quotient is {divisionNumber(data.quotient)}.</p>;
}

/** The tick scale represents numbers, independently of the context's physical quantity units. */
function NumericalGroupModel({data, blankFrame, constructed}: {data: FractionDivisionRelationProblem; blankFrame: boolean; constructed: boolean}) {
    const model = data.model;
    const x0 = 32;
    const width = 700;
    const x = (tick: number) => x0 + tick * width / model.coverageTicks;
    const tickWidth = width / model.coverageTicks;
    const ticks = Array.from({length: model.coverageTicks + 1}, (_, index) => index);
    const fill = constructed ? '#86efac' : '#a5b4fc';
    const alternateFill = constructed ? '#bbf7d0' : '#c7d2fe';
    return <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-1 text-base font-semibold text-slate-800">{blankFrame ? 'Blank numerical model frame' : 'Numerical common-part model'}</p>
        <svg viewBox={`0 0 770 ${blankFrame ? 165 : 290}`} className="w-full" role="img"
            aria-label={blankFrame ? 'Blank common-tick frame for constructing the numerical division model' : 'Dividend partitioned into divisor-sized groups on one numerical scale'}>
            <line x1={x0} x2={x(model.coverageTicks)} y1="38" y2="38" stroke="#475569" strokeWidth="2" />
            {ticks.map(tick => <g key={tick}>
                <line x1={x(tick)} x2={x(tick)} y1="34" y2={tick % model.ticksPerWhole === 0 ? 47 : 42} stroke="#475569" />
                {tick % model.ticksPerWhole === 0 && <text x={x(tick)} y="25" textAnchor="middle" fontSize="14" fill="#334155">{tick / model.ticksPerWhole}</text>}
            </g>)}
            {blankFrame ? <>
                <rect x={x0} y="76" width={width} height="38" fill="white" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" />
                {ticks.map(tick => <line key={tick} x1={x(tick)} x2={x(tick)} y1="76" y2="114" stroke="#e2e8f0" />)}
            </> : <>
                <text x={x0} y="73" fontSize="14" fontWeight="600" fill="#334155">Dividend: {originalDivisionOperand(data.dividend)}</text>
                {ticks.slice(0, -1).map(tick => <rect key={tick} x={x(tick)} y="83" width={tickWidth} height="29"
                    fill={tick < model.dividendTicks ? fill : '#f8fafc'} stroke="#64748b" strokeWidth="0.8" />)}
                <text x={x0} y="137" fontSize="14" fontWeight="600" fill="#334155">Divisor-sized groups</text>
                {model.groups.map((group, index) => <g key={index}>
                    <rect x={x(group.startTick)} y="147" width={x(group.endTick) - x(group.startTick)} height="30" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
                    <rect x={x(group.startTick)} y="147" width={group.filledTicks * tickWidth} height="30" fill={index % 2 === 0 ? fill : alternateFill} stroke="#334155" strokeWidth="1.4" />
                </g>)}
                {constructed && model.groups.length === 0 && <text x={x0} y="169" fontSize="16" fontWeight="600" fill="#166534">0 groups</text>}
                <text x={x0} y="209" fontSize="14" fontWeight="600" fill="#334155">One divisor-sized group: {originalDivisionOperand(data.divisor)}</text>
                {Array.from({length: model.divisorTicks}, (_, tick) => <rect key={tick} x={x(tick)} y="219" width={tickWidth} height="27" fill="#e0e7ff" stroke="#64748b" strokeWidth="0.8" />)}
            </>}
            <text x="385" y={blankFrame ? 149 : 278} textAnchor="middle" fontSize="14" fill="#475569">
                Each small interval is {model.ticksPerWhole === 1 ? '1 whole' : `1/${model.ticksPerWhole} of a whole`}. All rows use the same numerical scale.
            </text>
        </svg>
    </section>;
}

/** Selected optional mathematical claims remain visible without exposing an unknown quotient. */
function AdditionalRelation({data, solution}: {data: FractionDivisionRelationProblem; solution: boolean}) {
    if (!data.equationWitness && !data.multiplicationWitness) return null;
    return <div className={`mt-4 rounded-lg border p-3 text-center font-mono text-xl ${solution ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-slate-50'}`} data-evidence="product-relation">
        {solution ? <>{divisionFactor(data.inverse.quotientFactor)} × {divisionFactor(data.inverse.divisorFactor)}
            {data.multiplicationWitness && <> = {originalDivisionFraction(data.multiplicationWitness.unreducedProduct)}</>}
            {' '}= {originalDivisionOperand(data.inverse.reconstructedDividend)}</>
            : <>{divisionFactor(data.divisor)} × <AnswerBlank /> = {originalDivisionOperand(data.dividend)}</>}
    </div>;
}

function ExecutionTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="text-lg">Use the common-part model to find the exact quotient. Include any fractional part of a divisor-sized group.</p>
        <DivisionExpression data={data} showQuotient={isSolutionView} solution={isSolutionView} />
        <NumericalGroupModel data={data} blankFrame={false} constructed={false} />
        {isSolutionView && <Answer>
            <p className="font-mono font-semibold">{divisionFactor(data.dividend)} × {divisionFactor(data.reciprocal)} = {originalDivisionFraction(data.reciprocalProduct)} = {divisionNumber(data.quotient)}</p>
            <ModelSummary data={data} />
        </Answer>}
        <AdditionalRelation data={data} solution={isSolutionView} />
    </>;
}

function InterpretationTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="rounded-xl bg-indigo-50 p-4 text-lg leading-relaxed">{fractionDivisionStory(data)}</p>
        <p className="mt-3 text-lg">Interpret the quotient: what does it measure or count in this situation?</p>
        <DivisionExpression data={data} showQuotient={isSolutionView} solution={isSolutionView} />
        <NumericalGroupModel data={data} blankFrame={false} constructed={false} />
        {isSolutionView ? <Answer><p>{fractionDivisionMeaning(data)}</p><ModelSummary data={data} /></Answer>
            : <Blank>The quotient means: ______________________________________</Blank>}
        <AdditionalRelation data={data} solution={isSolutionView} />
    </>;
}

function InverseTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="text-lg">Explain why multiplying the quotient by the original divisor reconstructs the dividend.</p>
        <DivisionExpression data={data} showQuotient={true} solution={false} />
        <NumericalGroupModel data={data} blankFrame={false} constructed={false} />
        {isSolutionView ? <Answer>
            <p className="font-mono font-semibold">(a/b) ÷ (c/d) = (a × d)/(b × c)</p>
            <p className="mt-2">Multiplying by c/d cancels the nonzero c and d factors, leaving a/b.</p>
            <p className="mt-2 font-mono font-semibold">{divisionFactor(data.dividend)} × {divisionFactor(data.reciprocal)} = {originalDivisionFraction(data.reciprocalProduct)} = {divisionNumber(data.quotient)}</p>
            <p className="mt-2 font-mono font-semibold">{divisionFactor(data.inverse.quotientFactor)} × {divisionFactor(data.inverse.divisorFactor)}
                {data.multiplicationWitness && <> = {originalDivisionFraction(data.multiplicationWitness.unreducedProduct)}</>}
                {' '}= {originalDivisionOperand(data.inverse.reconstructedDividend)}</p>
            <p className="mt-2">The exact quotient times the divisor is the original amount, including the last fractional group.</p>
        </Answer> : <Blank><span className="font-mono">{divisionFactor(data.quotient)} × {divisionFactor(data.divisor)} = <AnswerBlank /></span>
            <p className="mt-3">Why does this reconstruct the dividend? ____________________</p></Blank>}
    </>;
}

function StoryTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="text-lg">Write a real-world story matching the division. Include units for the given quantities and a question answered by the quotient.</p>
        <DivisionExpression data={data} showQuotient={isSolutionView} solution={isSolutionView} />
        <NumericalGroupModel data={data} blankFrame={false} constructed={false} />
        {isSolutionView ? <Answer><p>One possible story: {fractionDivisionStory(data)}</p>
            <p className="mt-2 font-semibold">Answer: {divisionNumber(data.quotient)} {fractionDivisionAnswerUnit(data.context)}.</p></Answer>
            : <Blank>My story: ________________________________________________<div className="mt-4 h-6 border-b border-slate-300" /></Blank>}
        <AdditionalRelation data={data} solution={isSolutionView} />
    </>;
}

function WordProblemTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="rounded-xl bg-indigo-50 p-4 text-lg leading-relaxed">{fractionDivisionStory(data)}</p>
        {isSolutionView ? <>
            <DivisionExpression data={data} showQuotient={true} solution={true} />
            <NumericalGroupModel data={data} blankFrame={false} constructed={true} />
            <Answer><p className="font-semibold">{divisionNumber(data.quotient)} {fractionDivisionAnswerUnit(data.context)}</p>
                <p className="mt-2">{fractionDivisionMeaning(data)}</p></Answer>
        </> : <Blank>Equation: ____________________<p className="mt-3">Answer with units: ____________________</p>
            <p className="mt-3">Show your work: _______________________________________</p>
            {data.multiplicationWitness && <p className="mt-3">Check by multiplication: ____________________</p>}
        </Blank>}
        {isSolutionView && <AdditionalRelation data={data} solution={true} />}
    </>;
}

function ConstructionTask({data, isSolutionView}: TaskProps) {
    return <>
        <p className="text-lg">Construct a numerical model for the division. Mark the dividend, show divisor-sized groups, and include any fractional last group.</p>
        <DivisionExpression data={data} showQuotient={isSolutionView} solution={isSolutionView} />
        <NumericalGroupModel data={data} blankFrame={!isSolutionView} constructed={isSolutionView} />
        {isSolutionView && <Answer><ModelSummary data={data} /></Answer>}
        <AdditionalRelation data={data} solution={isSolutionView} />
    </>;
}

export function GeneralFractionDivisionBody({data, isSolutionView, task}: TaskProps & {task: GeneralFractionDivisionTask}) {
    const props = {data, isSolutionView};
    return <main className="w-[870px] max-w-[95vw] rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-900 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-indigo-950">{titles[task]}</h1>
        {task === 'division-execution' ? <ExecutionTask {...props} />
            : task === 'division-interpretation' ? <InterpretationTask {...props} />
                : task === 'division-inverse-explanation' ? <InverseTask {...props} />
                    : task === 'division-story-creation' ? <StoryTask {...props} />
                        : task === 'division-word-problem' ? <WordProblemTask {...props} />
                            : <ConstructionTask {...props} />}
    </main>;
}
