import type {ReactNode} from 'react';
import type {SignedContextObservation, SignedRationalContextMetadata, SignedRationalContextProblem} from '../../../types/problems.ts';
import {formatSignedRational as numeral} from './signed-meaning-helpers.ts';

export type SignedContextTask = 'contextual-zero' | 'signed-context-interpretation' | 'signed-context-formalization';
const language: Record<SignedRationalContextMetadata['kind'], {unit: string; framework: string; zero: string}> = {
    temperature: {unit: '°C', framework: 'These are temperatures on the Celsius scale.', zero: 'Zero degrees Celsius is the reference temperature on this scale.'},
    elevation: {unit: 'm', framework: 'These elevations are measured relative to sea level.', zero: 'Zero meters means the elevation is at sea level.'},
    balance: {unit: 'dollars', framework: 'These are net balances: funds available or amounts owed.', zero: 'Zero dollars means the balance is settled, with no net funds available and no net amount owed.'},
    charge: {unit: 'C', framework: 'These are net electric charges measured relative to neutrality.', zero: 'Zero coulombs means the net electric charge is neutral.'}
};

function meaning(context: SignedRationalContextMetadata, observation: SignedContextObservation): string {
    const amount = numeral(observation.magnitude);
    if (observation.sign === 0) return language[context.kind].zero;
    const positive = observation.sign === 1;
    switch (context.kind) {
        case 'temperature': return `${amount} degrees Celsius ${positive ? 'above' : 'below'} the Celsius reference temperature.`;
        case 'elevation': return `${amount} meters ${positive ? 'above' : 'below'} sea level.`;
        case 'balance': return positive ? `${amount} dollars of net funds are available.` : `${amount} dollars are owed.`;
        case 'charge': return `The net charge is ${positive ? 'positive' : 'negative'}, with magnitude ${amount} coulombs.`;
    }
}
function Answer({children}: {children: ReactNode}) {
    return <section data-role="solution" className="mt-4 space-y-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-lg leading-relaxed text-emerald-900">{children}</section>;
}
function Response() {
    return <div data-role="blank-response" className="mt-4 space-y-8 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-600"><p>Write your explanation:</p><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /></div>;
}
export function SignedContextBody({data, task, isSolutionView}: {data: SignedRationalContextProblem; task: SignedContextTask; isSolutionView: boolean}) {
    const words = language[data.context.kind];
    const formalization = task === 'signed-context-formalization';
    const title = task === 'contextual-zero' ? 'What does zero mean?' : formalization ? 'Write the signed values' : 'Interpret the signed values';
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-800 shadow-sm" style={{width: 790, maxWidth: '95vw'}}>
        <h1 className="mb-3 text-2xl font-bold text-indigo-950">{title}</h1>
        <p className="text-lg">{words.framework}</p>
        <div className="mt-4 space-y-3 rounded-xl bg-slate-100 p-4 text-lg" data-role={formalization ? 'context-prose' : 'signed-readings'}>
            {data.observations.map(observation => <p key={observation.id}>
                <strong>{observation.id}:</strong> {formalization ? meaning(data.context, observation) : <span className="font-mono font-semibold">{numeral(observation.value, true)} {words.unit}</span>}
            </p>)}
        </div>
        <p className="mt-4 text-lg">{task === 'contextual-zero' ? 'Explain what a value of zero means in this situation. Write a sentence.' :
            formalization ? 'Read each description and write its signed value, including the unit.' : 'Explain the meaning of each signed reading in this situation.'}</p>
        {isSolutionView ? <Answer>{task === 'contextual-zero' ? <p>{words.zero}</p> : data.observations.map(observation => <p key={observation.id} data-role="context-answer">
            <strong>{observation.id}:</strong> {formalization ? <span className="font-mono font-bold">{numeral(observation.value, true)} {words.unit}</span> : meaning(data.context, observation)}
        </p>)}</Answer> : formalization ? <div className="mt-4 space-y-4 rounded-xl border-2 border-dashed border-slate-300 p-4" data-role="blank-response">
            {data.observations.map(observation => <p key={observation.id}>{observation.id}: ____________________ {words.unit}</p>)}
        </div> : <Response />}
    </main>;
}
