import type {ReactNode} from 'react';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {percentFactorText, percentRationalText} from './percent-quantity-presentation.ts';

function PercentCard({title, children}: {title: string; children: ReactNode}) {
    return <main className="w-[790px] rounded-3xl bg-white p-7 font-sans text-slate-900 shadow-lg">
        <h1 className="mb-5 text-center text-2xl font-bold text-indigo-900">{title}</h1>
        <div className="flex flex-col gap-5">{children}</div>
    </main>;
}

function PercentEquivalence({data}: {data: PercentQuantityProblem}) {
    return <section className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
        <p className="mb-2 text-base font-semibold text-indigo-950">A percent is a rate per hundred</p>
        <p className="font-mono text-2xl">{data.percent}% = {data.perHundred.numerator}/{data.perHundred.denominator}
            {(data.scaleFactor.numerator !== data.perHundred.numerator || data.scaleFactor.denominator !== data.perHundred.denominator)
                && <> = {percentRationalText(data.scaleFactor)}</>}
        </p>
    </section>;
}

function QuantityResult({value, solution}: {value: string; solution: boolean}) {
    return solution
        ? <span className="inline-block rounded-lg border-2 border-emerald-400 bg-emerald-50 px-4 py-2 font-bold text-emerald-800" data-result="percent-quantity">{value}</span>
        : <span className="inline-block min-w-24 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 px-4 py-2 text-amber-900">□</span>;
}

export function PercentOfQuantityBody({data, isSolutionView}: {data: PercentQuantityProblem; isSolutionView: boolean}) {
    return <PercentCard title="Find a percent of a quantity">
        <p className="text-center text-xl">Find {data.percent}% of {percentRationalText(data.whole)}.</p>
        <PercentEquivalence data={data} />
        <section className="rounded-xl border-2 border-slate-200 p-5 text-center font-mono text-2xl leading-loose">
            {percentFactorText(data.perHundred)} × {percentFactorText(data.whole)} ={' '}
            <QuantityResult value={percentRationalText(data.part)} solution={isSolutionView} />
        </section>
    </PercentCard>;
}

export function PercentWholeInversionBody({data, isSolutionView}: {data: PercentQuantityProblem; isSolutionView: boolean}) {
    return <PercentCard title="Recover the reference whole">
        <p className="text-center text-xl">{percentRationalText(data.part)} is {data.percent}% of what quantity?</p>
        <PercentEquivalence data={data} />
        <section className="rounded-xl border-2 border-slate-200 p-5 text-center font-mono text-2xl leading-loose">
            {percentRationalText(data.part)} = {percentFactorText(data.perHundred)} ×{' '}
            <QuantityResult value={percentRationalText(data.whole)} solution={isSolutionView} />
        </section>
        {isSolutionView && <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-center text-emerald-950">
            <p className="mb-2 text-lg">Divide the given quantity by its scale factor to recover the whole.</p>
            <p className="font-mono text-2xl">{percentFactorText(data.part)} ÷ {percentFactorText(data.scaleFactor)} ={' '}
                <span className="font-bold text-emerald-800">{percentRationalText(data.whole)}</span>
            </p>
        </section>}
    </PercentCard>;
}
