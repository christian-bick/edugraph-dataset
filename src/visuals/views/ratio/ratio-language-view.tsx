import type {ReactNode} from 'react';
import type {RatioRelationProblem, UnitRateRelationProblem} from '../../../types/problems.ts';
import {ratioMeasure, ratioNumber, ratioQuantityMeasure, rateInterpretation, rateRequest, rateStory, scaledRateAnswer} from './ratio-language-presentation.ts';

const card = 'rounded-xl border-2 border-slate-300 bg-white p-5';
const response = (solution: boolean): string => `rounded-lg border-2 p-4 min-h-20 ${solution
    ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
    : 'border-dashed border-slate-400'}`;

const TaskCard = ({title, children}: {title: string; children: ReactNode}) =>
    <main className="w-[850px] max-w-[100vw] bg-slate-100 p-6 text-[20px] leading-snug text-slate-900">
        <h1 className="mb-5 text-[28px] font-bold">{title}</h1>
        <div className="flex flex-col gap-4">{children}</div>
    </main>;

export const RatioLanguageBody = ({data, isSolutionView}: {data: RatioRelationProblem; isSolutionView: boolean}) =>
    <TaskCard title="Explain the ratio">
        <section className={card}>
            <p className="mb-3">The ratio of <strong>{data.antecedent.name}</strong> to <strong>{data.consequent.name}</strong> is</p>
            <p className="text-center text-[34px] font-semibold">{ratioNumber(data.antecedent.value)} : {ratioNumber(data.consequent.value)}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-center text-[19px]">
                <span>First quantity: {data.antecedent.name} ({data.antecedent.unit})</span><span>Second quantity: {data.consequent.name} ({data.consequent.unit})</span>
            </div>
        </section>
        <p>Explain this ratio in a sentence using “for every”. Keep the quantities in the given order.</p>
        <section className={response(isSolutionView)} data-response="ratio-meaning">
            {isSolutionView
                ? `For every ${ratioQuantityMeasure(data.antecedent)}, there ${data.consequent.value.numerator === data.consequent.value.denominator ? 'is' : 'are'} ${ratioQuantityMeasure(data.consequent)}.`
                : <span className="block h-10 border-b border-slate-400" />}
        </section>
    </TaskCard>;

/** Both rate tasks retain the producer's original, normalized and scaled ratio witnesses. */
const RateEvidence = ({data}: {data: UnitRateRelationProblem}) =>
    <section className={card}>
        <p className="mb-2 font-semibold">Ordered ratio: {data.antecedent.name} to {data.consequent.name}</p>
        <p>{ratioMeasure(data.antecedent.value, data.antecedent.unit)} : {ratioMeasure(data.consequent.value, data.consequent.unit)}</p>
        <p className="mt-3">Divide both quantities by {ratioNumber(data.consequent.value)}:</p>
        <p>{ratioNumber(data.antecedent.value)} ÷ {ratioNumber(data.consequent.value)} = {ratioNumber(data.unitRate)};{' '}
            {ratioNumber(data.consequent.value)} ÷ {ratioNumber(data.consequent.value)} = 1</p>
        <p className="mt-2">Unit ratio: {ratioMeasure(data.unitRate, data.antecedent.unit)} : {ratioMeasure({numerator: 1, denominator: 1}, data.consequent.unit)}</p>
        <p className="mt-3">Multiply both original quantities by {ratioNumber(data.scaleFactor)}:</p>
        <p>{ratioNumber(data.antecedent.value)} × {ratioNumber(data.scaleFactor)} = {ratioNumber(data.scaled.antecedent)};{' '}
            {ratioNumber(data.consequent.value)} × {ratioNumber(data.scaleFactor)} = {ratioNumber(data.scaled.consequent)}</p>
        <p className="mt-2">Equivalent ratio: {ratioMeasure(data.scaled.antecedent, data.antecedent.unit)} : {ratioMeasure(data.scaled.consequent, data.consequent.unit)}</p>
    </section>;

export const UnitRateLanguageBody = ({data, isSolutionView}: {data: UnitRateRelationProblem; isSolutionView: boolean}) =>
    <TaskCard title="Explain the unit rate">
        <p>{rateStory(data)}</p>
        <RateEvidence data={data} />
        <p>Explain the unit rate in a sentence using “for every”. Say what each quantity measures and include its unit.</p>
        <section className={response(isSolutionView)} data-response="unit-rate-meaning">
            {isSolutionView ? rateInterpretation(data) : <span className="block h-10 border-b border-slate-400" />}
        </section>
    </TaskCard>;

export const UnitRateProblemBody = ({data, isSolutionView}: {data: UnitRateRelationProblem; isSolutionView: boolean}) =>
    <TaskCard title={data.context === 'price' ? 'Unit price problem' : 'Constant speed problem'}>
        <section className={card}>
            <p>{rateStory(data)}</p>
            <p className="mt-3 font-semibold">{rateRequest(data)}</p>
        </section>
        {isSolutionView ? <>
            <RateEvidence data={data} />
            <section className={response(true)} data-response="unit-rate-answer">
                <p>{rateInterpretation(data)}</p>
                <p className="mt-2">{scaledRateAnswer(data)}</p>
            </section>
        </> : <section className={response(false)} data-response="unit-rate-work">
            <p>Original ratio ({data.antecedent.name} : {data.consequent.name}): __________________</p>
            <p className="mt-3">Divide both quantities to get a per-one rate: __________________</p>
            <p className="mt-3">Scale both quantities to the requested amount: __________________</p>
            <p className="mt-3">Answer with units: __________________</p>
        </section>}
    </TaskCard>;
