import type {NumericalDataProblem} from '../../../types/problems.ts';
import {distributionUnit, distributionValue} from './numerical-distribution-format.tsx';

export const contextValue = distributionValue;
export const contextUnit = (data: NumericalDataProblem): string => distributionUnit(data.study);
export const unitName = (data: NumericalDataProblem, id: string): string => {
    const index = data.study.units.findIndex(row => row.id === id);
    return `U${index + 1} (${data.study.units[index].name})`;
};
export const occasionName = (data: NumericalDataProblem, id: string): string => {
    const index = data.study.occasions.findIndex(row => row.id === id);
    return `O${index + 1} (${data.study.occasions[index].name})`;
};

export function recordingMethod(data: NumericalDataProblem): string {
    const attribute = data.study.attribute;
    return attribute.kind === 'count' ? `counting ${attribute.countedObject}`
        : attribute.kind === 'length' ? 'using a ruler'
            : attribute.kind === 'duration' ? 'using a timer' : 'using a thermometer';
}

export function StudySource({data}: {data: NumericalDataProblem}) {
    const attribute = data.study.attribute;
    return <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4" data-role="data-study-source">
        <p>{data.study.populationName}. The observational units were described as {data.study.observationalUnitName}.</p>
        <p>The observer recorded {attribute.name} in {contextUnit(data)} by {recordingMethod(data)}{attribute.kind === 'count' ? '.' : `, with recording precision ${contextValue(attribute.precision)} ${contextUnit(data)}.`}</p>
        <p>{data.study.selection === 'distinct-units' ? 'Each entry concerns a different observational unit.' : 'The observations include the same unit on different occasions.'}</p>
        <p className="text-sm text-slate-600">Units: {data.study.units.map(row => unitName(data, row.id)).join('; ')}.</p>
        <p className="text-sm text-slate-600">Occasions: {data.study.occasions.map(row => occasionName(data, row.id)).join('; ')}.</p>
    </section>;
}

export function AttributeRecords({data}: {data: NumericalDataProblem}) {
    return <table className="w-full border-collapse text-sm" data-role="attribute-source-records">
        <thead><tr>{['Observational unit', 'Occasion', `Recorded value (${contextUnit(data)})`].map(label => <th key={label} className="border border-slate-200 bg-slate-50 px-3 py-2 text-left">{label}</th>)}</tr></thead>
        <tbody>{data.records.map(row => <tr key={row.id}><td className="border border-slate-200 px-3 py-2">{unitName(data, row.unitId)}</td><td className="border border-slate-200 px-3 py-2">{occasionName(data, row.occasionId)}</td><td className="border border-slate-200 px-3 py-2 font-mono">{contextValue(row.value)}</td></tr>)}</tbody>
    </table>;
}
