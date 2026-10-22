import type {ReactNode} from 'react';
import type {AlgebraCovariationProblem as Problem} from '../../../types/problems.ts';
import {CovariationDomains, CovariationEquation, CovariationModelMeaning, covariationPointLabel, covariationQuantityName, CovariationRoles, CovariationRowWork, CovariationSituation} from './algebra-covariation-format.tsx';
import {CovariationGraph} from './algebra-covariation-graph.tsx';
import {exactNumericNotation} from './numerical-power-expression-format.tsx';

export type CovariationTask = 'model' | 'interpret' | 'construct';
const Answer = ({children}: {children: ReactNode}) => <section className="mt-5 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900" data-role="covariation-answer">{children}</section>;
const Response = ({children}: {children: ReactNode}) => <div className="mt-5 min-h-28 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="covariation-response">{children}</div>;

function CovariationTable({data, construct, solution}: {data: Problem; construct: boolean; solution: boolean}) {
    return <table className="mt-4 w-full border-collapse text-center text-base" data-role="covariation-table"><thead><tr className="bg-slate-100">
        <th className="border border-slate-300 p-3">Point</th><th className="border border-slate-300 p-3">{covariationQuantityName(data.input)} <i>{data.input.symbol}</i><br />({data.input.unit.name})</th>
        <th className="border border-slate-300 p-3">{covariationQuantityName(data.output)} <i>{data.output.symbol}</i><br />({data.output.unit.name})</th>
        {construct && <th className="border border-slate-300 p-3">Ordered pair<br />(<i>{data.input.symbol}</i>, <i>{data.output.symbol}</i>)</th>}
    </tr></thead><tbody>{data.table.map(row => {
        return <tr key={row.rowId}><td className="border border-slate-300 p-3">{covariationPointLabel(data, row.rowId)}</td><td className="border border-slate-300 p-3">{exactNumericNotation(row.value.inputNotation)}</td>
            <td className={`border border-slate-300 p-3 ${construct && solution ? 'font-semibold text-emerald-800' : ''}`} data-role={construct && !solution ? 'covariation-output-blank' : 'covariation-output'}>{construct && !solution ? '____' : exactNumericNotation(row.value.outputNotation)}</td>
            {construct && <td className={`border border-slate-300 p-3 ${solution ? 'font-semibold text-emerald-800' : ''}`} data-role={solution ? 'covariation-ordered-pair' : 'covariation-pair-blank'}>{solution ? `(${exactNumericNotation(row.value.inputNotation)}, ${exactNumericNotation(row.value.outputNotation)})` : '(____, ____)'}</td>}
        </tr>;
    })}</tbody></table>;
}

/** The wrapper fixes the learner action; selected proof profiles never select or narrow it. */
export function AlgebraCovariationBody({data, task, isSolutionView, seed}: {data: Problem; task: CovariationTask; isSolutionView: boolean; seed: number}) {
    const model = task === 'model', construct = task === 'construct', first = data.table[0];
    const pointLabel = covariationPointLabel(data, first.rowId);
    return <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 800, maxWidth: '96vw'}}>
        <h1 className="text-xl font-semibold">{model ? 'Model the changing quantities' : construct ? 'Complete the table and graph' : 'Relate the equation, table and graph'}</h1>
        <p className="mt-3">{model ? <>Write {covariationQuantityName(data.output)} in terms of {covariationQuantityName(data.input)}. Use the letters <i>{data.input.symbol}</i> and <i>{data.output.symbol}</i>, define each, and identify the independent and dependent variables.</>
            : construct ? 'Complete the table and ordered pairs, then graph the relationship across its visible domain. Use a continuous segment for real inputs or isolated points for integer counts.'
                : 'Identify the independent and dependent variables. Explain how one table row, its equation values and its plotted point show the same relationship.'}</p>
        <section className="mt-4 rounded-xl bg-slate-100 p-5">
            {task !== 'interpret' && <CovariationSituation data={data} />}
            <CovariationDomains data={data} revealSymbols={!model} />
            {!model && <div className="mt-4 text-2xl leading-loose"><CovariationEquation data={data} /></div>}
        </section>
        {!model && <><CovariationTable data={data} construct={construct} solution={isSolutionView} />
            <CovariationGraph data={data} visible={!construct || isSolutionView} solutionGeometry={construct && isSolutionView} highlightedRowId={task === 'interpret' && isSolutionView ? first.rowId : null} seed={seed} /></>}
        {model ? isSolutionView ? <Answer><CovariationRoles data={data} /><div className="text-2xl leading-loose" data-role="covariation-model-equation"><CovariationEquation data={data} /></div><CovariationModelMeaning data={data} /></Answer>
            : <Response>Symbol definitions and domains: ____<br />Variable roles: ____<br />Equation: ____</Response>
            : task === 'interpret' ? isSolutionView ? <Answer><CovariationRoles data={data} /><p>In the row for point {pointLabel}, <i>{data.input.symbol}</i> = {exactNumericNotation(first.value.inputNotation)} {data.input.unit.name} corresponds to <i>{data.output.symbol}</i> = {exactNumericNotation(first.value.outputNotation)} {data.output.unit.name}. The same pair ({exactNumericNotation(first.value.inputNotation)}, {exactNumericNotation(first.value.outputNotation)}) locates that point on the graph.</p><CovariationRowWork value={first.value} /></Answer>
                : <Response>Variable roles and correspondence explanation: ____</Response> : null}
    </main>;
}
