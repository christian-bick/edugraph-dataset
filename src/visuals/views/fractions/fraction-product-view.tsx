import type {FractionProductProblem} from '../../../types/problems.ts';
import {formatProductOperand, formatProductValue, measureProductValue} from './fraction-product-helpers.ts';

export type FractionProductTask = 'partition-interpretation' | 'story-creation' | 'word-problem';

interface Props {
    data: FractionProductProblem;
    isSolutionView: boolean;
    task: FractionProductTask;
}

const multiplication = (data: FractionProductProblem): string =>
    `${formatProductOperand(data.multiplier)} × ${formatProductOperand(data.quantity)}`;

const unitWord = (data: FractionProductProblem): string =>
    data.product.numerator <= data.product.denominator ? 'meter' : 'meters';

function PartitionModel({data}: {data: FractionProductProblem}) {
    const x = 132;
    const rulerWidth = 560;
    const value = data.quantityValue.numerator / data.quantityValue.denominator;
    const rulerUnits = Math.ceil(value);
    const length = rulerWidth * value / rulerUnits;
    const b = data.partition.equalPartsPerCopy;
    const a = data.partition.selectedPartCount;
    return <svg viewBox="0 0 750 270" className="h-[270px] w-[750px] max-w-full" role="img"
        aria-label="Each full measured quantity is divided into equal parts; selected parts are highlighted">
        <text x="20" y="22" className="fill-slate-700 text-[14px] font-semibold">
            Each row is the complete {formatProductOperand(data.quantity)}-meter quantity.
        </text>
        <line x1={x} y1="60" x2={x + rulerWidth} y2="60" stroke="#475569" strokeWidth="2" />
        {Array.from({length: rulerUnits + 1}, (_, index) => <g key={index}>
            <line x1={x + index * rulerWidth / rulerUnits} y1="54"
                x2={x + index * rulerWidth / rulerUnits} y2="67" stroke="#475569" strokeWidth="2" />
            <text x={x + index * rulerWidth / rulerUnits} y="48" textAnchor="middle"
                className="fill-slate-600 text-[11px]">{index} m</text>
        </g>)}
        {Array.from({length: data.partition.copyCount}, (_, copy) => <g key={copy}>
            <text x="20" y={104 + copy * 52} className="fill-slate-700 text-[13px] font-semibold">
                Copy {copy + 1}
            </text>
            {Array.from({length: b}, (_, part) => {
                const selected = copy * b + part < a;
                return <rect key={part} x={x + part * length / b} y={80 + copy * 52}
                    width={length / b} height="34" fill={selected ? '#7dd3fc' : '#f1f5f9'}
                    stroke="#334155" strokeWidth="1.5" />;
            })}
            <line x1={x + length} y1={79 + copy * 52} x2={x + length} y2={115 + copy * 52}
                stroke="#1e293b" strokeWidth="2" />
        </g>)}
        <text x="375" y="251" textAnchor="middle" className="fill-slate-600 text-[13px] font-semibold">
            Blue sections are selected; every section is an equal part of its full row.
        </text>
    </svg>;
}

function ProductEquation({data, isSolutionView}: Omit<Props, 'task'>) {
    return <div className={`mt-4 rounded-xl border-2 p-4 text-center font-mono text-2xl font-bold ${
        isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
            : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
        {multiplication(data)}{isSolutionView && <> = {formatProductValue(data.product)}</>}
    </div>;
}

const Answer = ({children}: {children: React.ReactNode}) =>
    <div className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-base leading-relaxed text-emerald-950">{children}</div>;
const Blank = ({children}: {children: React.ReactNode}) =>
    <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-base font-semibold text-slate-600">{children}</div>;

function PartitionExplanation({data}: {data: FractionProductProblem}) {
    const a = data.partition.selectedPartCount;
    const b = data.partition.equalPartsPerCopy;
    const q = formatProductOperand(data.quantity);
    const product = formatProductValue(data.product);
    return <>
        {data.operandForm === 'mixed-numbers' && <p className="mb-2">
            The multiplier {formatProductOperand(data.multiplier)} equals {a}/{b}, so its full numerator selects {a} parts across the copies.
        </p>}
        <p>Each complete {q}-meter quantity is split into {b} equal parts.
            {' '}One part is {measureProductValue(data.partition.onePartValue)}. The model selects {a} of these parts
            {' '}across {data.partition.copyCount} {data.partition.copyCount === 1 ? 'copy' : 'copies'}, giving {product} {unitWord(data)}.</p>
        <div className="mt-2 font-mono font-bold">
            {a} × ({q} ÷ {b}) = {product}; &nbsp; ({a} × {q}) ÷ {b} = {formatProductValue(data.partition.scaledQuantity)} ÷ {b} = {product}.
        </div>
    </>;
}

function PartitionInterpretationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="text-base text-slate-700">Explain how the equal parts and blue sections represent the fraction product. What do the numerator and denominator each tell you?</p>
        <ProductEquation data={data} isSolutionView={isSolutionView} />
        <div className="mt-3"><PartitionModel data={data} /></div>
        {isSolutionView ? <Answer><PartitionExplanation data={data} /></Answer>
            : <Blank>Each equal part means ______. The selected parts mean ______. Why? ____________________</Blank>}
    </>;
}

function exampleStory(data: FractionProductProblem): string {
    const q = measureProductValue(data.quantityValue);
    const copies = data.partition.copyCount;
    const b = data.partition.equalPartsPerCopy;
    const a = data.partition.selectedPartCount;
    const setup = copies === 1
        ? `a ${data.context.material} measuring ${q} is prepared. It is cut`
        : `${copies} identical ${data.context.material}s, each ${q} long, are prepared. Each is cut`;
    return `For a weaving project, ${setup} into ${b} equal pieces. The project uses ${a} of these pieces. How many meters of ${data.context.material} are used?`;
}

function StoryCreationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="text-base text-slate-700">Write a {data.context.material} story for this product. Preserve the full measured quantity, its equal partitions, and the selected parts.</p>
        <ProductEquation data={data} isSolutionView={isSolutionView} />
        <div className="mt-3"><PartitionModel data={data} /></div>
        {isSolutionView ? <Answer>Example story: {exampleStory(data)} The answer is {measureProductValue(data.product)}.</Answer>
            : <Blank>My story: ____________________________________________________</Blank>}
    </>;
}

function storyProblem(data: FractionProductProblem): string {
    const factor = formatProductOperand(data.multiplier);
    const reference = measureProductValue(data.quantityValue);
    const usePhrase = data.multiplierValue.numerator < data.multiplierValue.denominator
        ? `${factor} of that length` : `${factor} times that length`;
    return `A reference ${data.context.material} is ${reference} long. A weaving project uses ${usePhrase}. How many meters of ${data.context.material} does the project use?`;
}

function WordProblemTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <p className="rounded-xl bg-indigo-50 p-5 text-lg leading-relaxed text-indigo-950">{storyProblem(data)}</p>
        {isSolutionView ? <>
            <div className="mt-3"><PartitionModel data={data} /></div>
            <Answer>
                <div className="font-mono font-bold">{multiplication(data)} = {formatProductValue(data.product)} {unitWord(data)}</div>
                <div className="mt-2">The project uses {measureProductValue(data.product)} of {data.context.material}.</div>
                {data.equationWitness && <div className="mt-2 font-mono">
                    {formatProductValue(data.equationWitness.factor)} × {formatProductValue(data.equationWitness.referenceMeasure)}
                    {' '}= {formatProductValue(data.equationWitness.productMeasure)} {unitWord(data)}
                </div>}
            </Answer>
        </> : <Blank>Equation: ____________________ &nbsp; Answer with units: ____________________</Blank>}
    </>;
}

const titles: Record<FractionProductTask, string> = {
    'partition-interpretation': 'Interpret a fraction product',
    'story-creation': 'Create a fraction-product story',
    'word-problem': 'Solve a fraction-product story'
};

export function FractionProductBody({data, isSolutionView, task}: Props) {
    const common = {data, isSolutionView};
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm"
        style={{width: 840, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Fraction of a measured quantity</div>
        <h1 className="mb-3 mt-2 text-2xl font-bold">{titles[task]}</h1>
        {task === 'partition-interpretation' ? <PartitionInterpretationTask {...common} />
            : task === 'story-creation' ? <StoryCreationTask {...common} />
                : <WordProblemTask {...common} />}
    </main>;
}
