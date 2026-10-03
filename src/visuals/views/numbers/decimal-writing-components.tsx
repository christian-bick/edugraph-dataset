import type {ReactNode} from 'react';

export function DecimalWritingFrame({eyebrow, title, prompt, children}: {
    eyebrow: string;
    title: string;
    prompt: string;
    children: ReactNode;
}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm" style={{width: 760, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-base leading-relaxed">{prompt}</p>
        {children}
    </main>;
}

export function DecimalSourceCard({label, children, numeral = false}: {
    label: string;
    children: ReactNode;
    numeral?: boolean;
}) {
    return <div className="mt-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-6 py-6 text-center">
        <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">{label}</div>
        <div className={`mt-2 font-bold text-indigo-950 ${numeral ? 'font-mono text-5xl' : 'text-2xl leading-snug'}`}>{children}</div>
    </div>;
}

export function DecimalAnswerCard({isSolutionView, placeholder, children}: {
    isSolutionView: boolean;
    placeholder: string;
    children: ReactNode;
}) {
    return <div className={`mt-5 flex min-h-24 items-center justify-center rounded-xl border-2 px-6 py-5 text-center text-xl font-semibold leading-snug ${
        isSolutionView
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-dashed border-slate-300 bg-white text-slate-500'
    }`}>
        {isSolutionView ? children : placeholder}
    </div>;
}
