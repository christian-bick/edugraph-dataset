import type {ReactNode} from 'react';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {RatioTableProblem} from '../../../types/problems.ts';
import {assertRatioComparison, assertRatioPlotScale, assertRatioTable, ratioEquivalence, ratioQuantityPhrase, ratioTableHeading} from './ratio-table-helpers.ts';

type TableTask = 'construction' | 'missing-values' | 'plotting';
type TableViewId = 'ratio-table-construction' | 'ratio-table-missing-values' | 'ratio-coordinate-plotting';

function Card({title, children}: {title: string; children: ReactNode}) {
    return <div className="w-[860px] rounded-3xl bg-white p-7 font-sans text-slate-900 shadow-lg">
        <h1 className="mb-5 text-center text-2xl font-bold text-indigo-900">{title}</h1>
        {children}
    </div>;
}

function Blank() {
    return <span className="inline-flex h-10 min-w-20 items-center justify-center rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 text-amber-800">?</span>;
}

function RatioTable({data, hidden, revealed, title}: {
    data: RatioTableProblem;
    hidden: (row: number, column: number) => boolean;
    revealed: (row: number, column: number) => boolean;
    title: string;
}) {
    return <div className="overflow-hidden rounded-xl border-2 border-indigo-200">
        <div className="bg-indigo-800 px-4 py-2 text-center font-bold text-white">{title}</div>
        <table className="w-full table-fixed border-collapse text-center text-lg">
            <thead className="bg-indigo-50 text-indigo-950"><tr>
                {data.quantities.map((quantity, index) => <th className="border border-indigo-200 p-3 text-base" key={index}>{ratioTableHeading(quantity)}</th>)}
            </tr></thead>
            <tbody>{data.rows.map((row, index) => <tr key={index}>
                {[row.antecedent, row.consequent].map((value, column) => <td className={`h-16 border border-indigo-200 px-3 py-2 font-mono font-semibold ${revealed(index, column) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-900'}`} key={column}>
                    {hidden(index, column) ? <Blank /> : value}
                </td>)}
            </tr>)}</tbody>
        </table>
    </div>;
}

function Evidence({children, solution}: {children: ReactNode; solution: boolean}) {
    return <div className={`mt-5 rounded-xl border-2 p-4 text-center text-lg leading-relaxed ${solution ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-slate-50'}`}>{children}</div>;
}

function RatioGrid({data, solution}: {data: RatioTableProblem; solution: boolean}) {
    const {xStep, yStep, xMax, yMax} = data.coordinateScale;
    const left = 65;
    const top = 24;
    const width = 330;
    const height = 300;
    const x = (value: number) => left + width * value / xMax;
    const y = (value: number) => top + height - height * value / yMax;
    const xTicks = Array.from({length: xMax / xStep + 1}, (_, index) => index * xStep);
    const yTicks = Array.from({length: yMax / yStep + 1}, (_, index) => index * yStep);
    return <svg width="430" height="410" viewBox="0 0 430 410" role="img" aria-label={solution ? 'Coordinate grid with ratio pairs plotted' : 'Coordinate grid for plotting ratio pairs'}>
        {xTicks.map(value => <g key={`x-${value}`}>
            <line x1={x(value)} x2={x(value)} y1={top} y2={y(0)} stroke="#cbd5e1" />
            <text x={x(value)} y={y(0) + 23} textAnchor="middle" fontSize="14" fill="#334155">{value}</text>
        </g>)}
        {yTicks.map(value => <g key={`y-${value}`}>
            <line x1={left} x2={x(xMax)} y1={y(value)} y2={y(value)} stroke="#cbd5e1" />
            <text x={left - 10} y={y(value) + 5} textAnchor="end" fontSize="14" fill="#334155">{value}</text>
        </g>)}
        <line x1={left} x2={x(xMax) + 8} y1={y(0)} y2={y(0)} stroke="#0f172a" strokeWidth="2" />
        <line x1={left} x2={left} y1={y(0)} y2={top - 8} stroke="#0f172a" strokeWidth="2" />
        <text x={left + width / 2} y="385" textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a">x: {ratioTableHeading(data.quantities[0])}</text>
        <text transform="translate(18 174) rotate(-90)" textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a">y: {ratioTableHeading(data.quantities[1])}</text>
        {solution && data.rows.map((row, index) => <g key={index}>
            <circle cx={x(row.antecedent)} cy={y(row.consequent)} r="6" fill="#059669" stroke="white" strokeWidth="2" />
            <text x={x(row.antecedent) + (row.antecedent > xMax * 0.7 ? -9 : 9)} y={y(row.consequent) - 10}
                textAnchor={row.antecedent > xMax * 0.7 ? 'end' : 'start'} fontSize="13" fontWeight="600" fill="#065f46">({row.antecedent}, {row.consequent})</text>
        </g>)}
    </svg>;
}

export function RatioTableView({task, payload, viewId}: {
    task: TableTask;
    payload: ViewRenderPayload<TableViewId>;
    viewId: TableViewId;
}) {
    const data = payload.problem.data;
    assertRatioTable(viewId, data);
    const solution = payload.isSolutionView;
    if (task === 'plotting') {
        assertRatioPlotScale(viewId, data);
        return <Card title="Plot equivalent ratios">
            <p className="mb-4 text-center text-lg">Plot every table row as an ordered pair (x, y) on the coordinate grid.</p>
            <div className="flex items-start justify-between gap-5">
                <div className="w-[325px]"><RatioTable data={data} title="Equivalent-ratio table" hidden={() => false} revealed={() => false} /></div>
                <RatioGrid data={data} solution={solution} />
            </div>
            <Evidence solution={solution}>{solution ? ratioEquivalence(data) : 'Use the horizontal and vertical scales to place the points.'}</Evidence>
        </Card>;
    }
    const construction = task === 'construction';
    const answerCell = (row: number, column: number) => construction ? row > 0
        : (row === data.rows.length - 2 && column === 0)
            || (row === data.rows.length - 1 && column === 1);
    return <Card title={construction ? 'Construct an equivalent-ratio table' : 'Find missing ratio-table values'}>
        <p className="mb-5 text-center text-lg">{construction
            ? `Add ${data.rows.length - 1} different rows of positive whole-number quantities that have the same ratio as the first row.`
            : 'Fill each blank so every row has the same ratio of the two quantities.'}</p>
        <div className="mx-auto w-[620px]"><RatioTable data={data} title="Equivalent-ratio table"
            hidden={(row, column) => !solution && answerCell(row, column)}
            revealed={(row, column) => solution && answerCell(row, column)} /></div>
        <Evidence solution={solution}>{solution
            ? <>{construction && <span className="mb-1 block font-semibold">One possible table</span>}{ratioEquivalence(data)}</>
            : construction ? 'Keep the quantity order shown in the column headings.' : 'Use the complete rows to recover each missing value.'}</Evidence>
    </Card>;
}

export function RatioTableComparisonView({payload}: {payload: ViewRenderPayload<'ratio-table-comparison'>}) {
    const data = payload.problem.data;
    assertRatioComparison('ratio-table-comparison', data);
    const solution = payload.isSolutionView;
    const {normalized: common, left, right} = data;
    const symbol = data.relation === 'less' ? '<' : data.relation === 'greater' ? '>' : '=';
    const words = data.relation === 'less' ? 'less' : data.relation === 'greater' ? 'more' : 'the same amount of';
    const comparisonWord = data.relation === 'equal' ? 'as' : 'than';
    const commonQuantity = ratioQuantityPhrase(common.consequent, left.quantities[1]);
    return <Card title="Compare ratios using tables">
        <p className="mb-5 text-lg leading-relaxed">Complete both final rows. For the same {commonQuantity}, does ratio A use less, the same amount of, or more {left.quantities[0].name} than ratio B?</p>
        <div className="grid grid-cols-2 gap-6">
            <RatioTable data={left} title="Ratio A"
                hidden={(row, column) => !solution && row === left.rows.length - 1 && column === 0}
                revealed={(row, column) => solution && row === left.rows.length - 1 && column === 0} />
            <RatioTable data={right} title="Ratio B"
                hidden={(row, column) => !solution && row === right.rows.length - 1 && column === 0}
                revealed={(row, column) => solution && row === right.rows.length - 1 && column === 0} />
        </div>
        <Evidence solution={solution}>{solution ? <>
            <div className="font-mono text-2xl font-bold">{common.leftAntecedent} {symbol} {common.rightAntecedent}</div>
            <div>For {commonQuantity}, ratio A uses {words} {left.quantities[0].name} {comparisonWord} ratio B.</div>
            <div className="mt-2 text-base">A: {ratioEquivalence(left)}<br />B: {ratioEquivalence(right)}</div>
        </> : 'Ratio A compared with ratio B: less / equal / greater = ?'}</Evidence>
    </Card>;
}
