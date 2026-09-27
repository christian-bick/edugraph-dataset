import {ReactNode} from 'react';
import {ArithmeticPropertyProblem} from '../../../types/problems.ts';
import {
    propertyExplanation,
    propertyExplanationPrompt,
    propertyNames,
    validateArithmeticProperty
} from './arithmetic-properties-helpers.ts';

interface PropertiesProps {
    data: ArithmeticPropertyProblem;
    isSolutionView: boolean;
}

const ValueBox = ({value, highlighted = false}: {value?: number; highlighted?: boolean}) => (
    <div className={`w-[62px] h-[58px] border-2 rounded-xl flex items-center justify-center font-mono text-[2rem] font-bold ${
        highlighted
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
            : 'border-slate-400 bg-white text-slate-800'
    }`}>
        {value}
    </div>
);

function PropertyEquations({data, completed, highlighted}: {
    data: ArithmeticPropertyProblem;
    completed: boolean;
    highlighted: boolean;
}) {
    const missingValue = completed
        ? (data.propertyLaw === 'commutative' ? data.num1 : data.num3)
        : undefined;
    const symbol = data.operation === 'addition' ? '+' : '×';

    if (data.propertyLaw === 'distributive') {
        return (
            <div className="flex flex-col items-center gap-5 font-mono text-[1.65rem] font-bold text-slate-700">
                <div className="flex items-center gap-2">
                    <span>{data.num1} × ({data.num2} + {data.num3})</span>
                    <span>=</span>
                    <span>{data.num1} × {data.combinedFactor}</span>
                    <span>=</span>
                    <ValueBox value={completed ? data.answer : undefined} highlighted={highlighted} />
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-indigo-600">Distribute the factor</div>
                <div className="flex items-center gap-2">
                    <span>({data.num1} × {data.num2}) + ({data.num1} × {data.num3})</span>
                    <span>=</span>
                    <span>{data.partialProducts[0]} + {data.partialProducts[1]}</span>
                    <span>=</span>
                    <ValueBox value={completed ? data.answer : undefined} highlighted={highlighted} />
                </div>
            </div>
        );
    }
    return data.propertyLaw === 'commutative' ? (
        <div className="flex items-center gap-3 text-[2rem] font-bold text-slate-700">
            <ValueBox value={data.num1} />
            <span>{symbol}</span>
            <ValueBox value={data.num2} />
            <span>{symbol}</span>
            <ValueBox value={data.num3} />
            <span>=</span>
            <ValueBox value={data.num3} />
            <span>{symbol}</span>
            <ValueBox value={data.num2} />
            <span>{symbol}</span>
            <ValueBox value={missingValue} highlighted={highlighted} />
        </div>
    ) : (
        <div className="flex items-center gap-2 text-[2rem] font-bold text-slate-700">
            <span>(</span>
            <ValueBox value={data.num1} />
            <span>{symbol}</span>
            <ValueBox value={data.num2} />
            <span>) {symbol}</span>
            <ValueBox value={data.num3} />
            <span>=</span>
            <ValueBox value={data.num1} />
            <span>{symbol} (</span>
            <ValueBox value={data.num2} />
            <span>{symbol}</span>
            <ValueBox value={missingValue} highlighted={highlighted} />
            <span>)</span>
        </div>
    );
}

function PropertiesFrame({children}: {children: ReactNode}) {
    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[650px]">{children}</div>
        </div>
    );
}

function PropertyName({data}: {data: ArithmeticPropertyProblem}) {
    return <div className="mb-6 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-semibold font-sans">{propertyNames[data.propertyLaw]}</div>;
}

export function ArithmeticPropertiesCompletion({data, isSolutionView}: PropertiesProps) {
    validateArithmeticProperty(data, 'operations-properties');
    return (
        <PropertiesFrame>
            <div className="h-[34px] mb-3 text-[1.3rem] font-bold text-slate-700 text-center font-sans">
                {!isSolutionView && 'Complete the equation to show the property.'}
            </div>
            <PropertyName data={data} />
            <PropertyEquations data={data} completed={isSolutionView} highlighted={isSolutionView} />
        </PropertiesFrame>
    );
}

export function ArithmeticPropertiesExplanation({data, isSolutionView}: PropertiesProps) {
    validateArithmeticProperty(data, 'operations-properties-explanation');
    const explanation = propertyExplanation(data);
    return (
        <PropertiesFrame>
            <div className="mb-4 text-[1.2rem] font-bold leading-relaxed text-slate-700 text-center font-sans">
                {propertyExplanationPrompt(data)}
            </div>
            <PropertyName data={data} />
            <PropertyEquations data={data} completed highlighted={false} />
            {isSolutionView ? (
                <div className="mt-6 w-full rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 font-sans text-emerald-900">
                    <div className="font-bold">How the procedure works</div>
                    <p className="mt-1 text-base leading-relaxed">{explanation.method}</p>
                    <div className="mt-4 font-bold">Why the result stays the same</div>
                    <p className="mt-1 text-base leading-relaxed">{explanation.reason}</p>
                </div>
            ) : (
                <div className="mt-6 w-full rounded-xl border-2 border-dashed border-slate-400 p-5 font-sans text-slate-600">
                    <div className="font-semibold">Explain the steps and why they work.</div>
                    <div className="mt-4 h-12 border-b border-slate-300" />
                </div>
            )}
        </PropertiesFrame>
    );
}
