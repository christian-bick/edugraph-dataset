import type {NumericalDataProblem} from '../../../types/problems.ts';
import {AttributeRecords, contextUnit, contextValue, occasionName, recordingMethod, StudySource, unitName} from './data-context-format.tsx';

export type DataContextTask = 'observation-count' | 'attribute-description';

function ObservationCount({data, solution}: {data: NumericalDataProblem; solution: boolean}) {
    const enumeration = data.relations.find(row => row.kind === 'sample-cardinality');
    const cards = data.records.map(row => ({id: row.id, text: contextValue(row.value)}));
    const longestValue = cards.reduce((width, row) => Math.max(width, row.text.length), 1);
    // Monospaced value width controls presentation; narrower containers may wrap without losing digits.
    const columns = `repeat(auto-fit, minmax(min(100%, max(calc((100% - 2.25rem) / 4), calc(${longestValue}ch + 2.25rem))), 1fr))`;
    return <>
        <p className="text-xl font-semibold">How many observations are in this recorded collection?</p>
        <p>{data.study.populationName}. Each entry below is one observation of {data.study.attribute.name}, in {contextUnit(data)}.</p>
        <p className="text-sm text-slate-600">Repeated values still represent separate observations.</p>
        <div className="grid gap-3 font-mono text-xl" style={{gridTemplateColumns: columns}} data-role="observation-value-cards">{cards.map(row => <div key={row.id} className="min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-center" style={{overflowWrap: 'anywhere'}} data-role="observation-value-card">{row.text}</div>)}</div>
        {solution ? <section className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800" data-role="observation-count-answer">
            {enumeration && <div className="grid grid-cols-2 gap-2" data-role="observation-count-enumeration">{enumeration.enumeration.map(row => <p key={row.recordId}>Count {row.ordinal}: value {contextValue(data.records.find(record => record.id === row.recordId)!.value)}</p>)}</div>}
            <p className="text-lg font-semibold">There are {enumeration ? enumeration.count : data.summary.count} recorded observations.</p>
            <p>Each entry counts once, including entries with the same value.</p>
        </section> : <p className="border-t border-slate-200 pt-4 text-slate-500" data-role="observation-count-blank">Number of recorded observations: ____________________</p>}
    </>;
}

function AttributeDescription({data, solution}: {data: NumericalDataProblem; solution: boolean}) {
    const proof = data.relations.find(row => row.kind === 'variable-recording');
    // Both representations carry the same actual source recording incidences.
    const incidences = proof ? proof.incidences : data.records;
    return <>
        <p className="text-xl font-semibold">Describe the observational unit, recorded attribute, recording method and unit of measurement.</p>
        <StudySource data={data} />
        <AttributeRecords data={data} />
        {solution ? <section className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800" data-role="attribute-description-answer">
            <dl className="space-y-2"><div><dt className="font-semibold">Observational unit</dt><dd>{data.study.observationalUnitName}</dd></div>
                <div><dt className="font-semibold">Recorded attribute</dt><dd>{data.study.attribute.name}</dd></div>
                <div><dt className="font-semibold">Recording method</dt><dd>{recordingMethod(data)}</dd></div>
                <div><dt className="font-semibold">Unit of measurement</dt><dd>{contextUnit(data)}</dd></div></dl>
            <p className="text-sm" data-role="attribute-recording-links">{incidences.map(row => `${unitName(data, row.unitId)}, ${occasionName(data, row.occasionId)}: ${contextValue(row.value)} ${contextUnit(data)}`).join('; ')}.</p>
        </section> : <div className="space-y-3 border-t border-slate-200 pt-4 text-slate-500" data-role="attribute-description-blank"><p>Observational unit: ________________________________</p><p>Recorded attribute: ________________________________</p><p>Recording method: ________________________________</p><p>Unit of measurement: ________________________________</p></div>}
    </>;
}

export function DataContextBody({data, task, isSolutionView}: {data: NumericalDataProblem; task: DataContextTask; isSolutionView: boolean}) {
    return <main className="w-[800px] max-w-full space-y-5 rounded-2xl bg-white p-7 font-sans text-[17px] leading-relaxed text-slate-800 shadow-sm">
        {task === 'observation-count' ? <ObservationCount data={data} solution={isSolutionView} /> : <AttributeDescription data={data} solution={isSolutionView} />}
    </main>;
}
