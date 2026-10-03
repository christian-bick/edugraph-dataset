import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {
    ArithmeticPairedPatternCorrespondence,
    ArithmeticPairedPatternProblem,
    ArithmeticPairedPatternSequence
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    correspondenceExplanation,
    correspondenceStatement,
    validatePairedPattern
} from './paired-pattern-helpers.ts';

export type PairedPatternViewId =
    | 'operations-pattern-correspondence'
    | 'operations-pattern-correspondence-explanation'
    | 'operations-paired-pattern-generation';

export type PairedPatternMode = 'identify' | 'explain' | 'generate';

interface Props {
    mode: PairedPatternMode;
    payload: ViewRenderPayload<PairedPatternViewId>;
    viewId: PairedPatternViewId;
}

function RuleCard({name, sequence}: {name: string; sequence: ArithmeticPairedPatternSequence}) {
    return <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
        <div className="text-sm font-bold text-indigo-800">{name}</div>
        <div className="mt-1 text-lg text-slate-900">Start at <strong>{sequence.start}</strong>; add <strong>{sequence.rule.increment}</strong> each step.</div>
    </div>;
}

function PatternTable({data, hideLaterTerms}: {
    data: ArithmeticPairedPatternProblem;
    hideLaterTerms: boolean;
}) {
    const columns = {gridTemplateColumns: `minmax(120px, 1.5fr) repeat(${data.first.terms.length}, minmax(66px, 1fr))`};
    return <div className="mt-5 overflow-hidden rounded-xl border border-slate-300">
        <div className="grid bg-slate-800 text-center text-sm font-bold text-white" style={columns}>
            <div className="px-2 py-3">Position</div>
            {data.first.terms.map((_, index) => <div key={index} className="border-l border-slate-600 px-2 py-3">{index}</div>)}
        </div>
        {([
            ['Pattern A', data.first.terms],
            ['Pattern B', data.second.terms]
        ] as const).map(([name, terms]) => <div key={name} className="grid border-t border-slate-300 text-center" style={columns}>
            <div className="bg-slate-100 px-2 py-4 text-sm font-bold text-slate-700">{name}</div>
            {terms.map((term, index) => <div key={index} className={`border-l border-slate-200 px-2 py-4 font-mono text-xl font-bold ${hideLaterTerms && index > 0 ? 'bg-white text-slate-400' : 'bg-white text-slate-900'}`}>
                {hideLaterTerms && index > 0 ? '?' : term}
            </div>)}
        </div>)}
    </div>;
}

function AnswerSpace({instruction}: {instruction: string}) {
    return <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 text-slate-500">
        {instruction}
    </div>;
}

/** Three fixed learner tasks over the same canonical pair of aligned recurrences. */
export function PairedPatternView({mode, payload, viewId}: Props) {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, ['kind', 'first', 'second']);
    validatePairedPattern(viewId, data, mode !== 'generate');
    const relation: ArithmeticPairedPatternCorrespondence | undefined = mode === 'generate'
        ? undefined : data.correspondence;
    if (mode !== 'generate' && !relation) {
        throw new ViewValidationError(viewId, 'A correspondence task requires an exact relation.');
    }
    const relationText = relation ? correspondenceStatement(relation) : '';

    const title = mode === 'identify' ? 'Find the relationship'
        : mode === 'explain' ? 'Explain the relationship'
            : 'Generate two number patterns';
    const prompt = mode === 'identify'
        ? 'What relationship holds between the terms at the same position in Pattern A and Pattern B?'
        : mode === 'explain'
            ? `${relationText} Explain why this relationship holds using the starting values and the two rules.`
            : 'Use both rules to complete the two patterns. Keep terms in the same positions aligned.';

    return <main className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm" style={{width: 880, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Paired number patterns</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed">{prompt}</p>
        <div className="mt-5 grid grid-cols-2 gap-4">
            <RuleCard name="Pattern A rule" sequence={data.first} />
            <RuleCard name="Pattern B rule" sequence={data.second} />
        </div>
        <PatternTable data={data} hideLaterTerms={mode === 'generate' && !isSolutionView} />
        {mode === 'identify' && (isSolutionView
            ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-lg font-semibold text-emerald-950">
                {relationText}
            </div>
            : <AnswerSpace instruction="Write the relationship between corresponding terms." />)}
        {mode === 'explain' && (isSolutionView
            ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-lg leading-relaxed text-emerald-950">
                {relation && correspondenceExplanation(data, relation)}
            </div>
            : <AnswerSpace instruction="Write why the relationship continues at every position." />)}
        {mode === 'generate' && isSolutionView && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-base font-semibold text-emerald-950">
            Each row begins with its stated start and advances by its own rule.
        </div>}
    </main>;
}
