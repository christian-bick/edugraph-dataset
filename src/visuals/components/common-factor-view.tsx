import type {ReactNode} from 'react';
import type {CommonFactorMultipleProblem, FullCommonFactorDistributionProblem} from '../../types/problems.ts';
import {ViewValidationError} from '../helpers/validation.ts';

function Card({title, children}: {title: string; children: ReactNode}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-800 shadow-sm" style={{width: 820, maxWidth: '95vw'}}>
        <h1 className="mb-4 text-2xl font-bold text-indigo-950">{title}</h1>{children}
    </main>;
}
function Given({children}: {children: ReactNode}) {
    return <div className="my-4 rounded-xl bg-slate-100 p-4 text-center font-mono text-2xl font-semibold text-slate-900" data-role="given">{children}</div>;
}
function Solution({children}: {children: ReactNode}) {
    return <section className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-lg leading-relaxed text-emerald-900" data-role="solution">{children}</section>;
}
function Workspace({response}: {response: string}) {
    return <section className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-lg text-slate-700" data-role="blank-work">
        <p>{response}</p><div className="h-32" /><div className="border-b border-slate-300" />
    </section>;
}
function DivisorList({values}: {values: readonly number[]}) {
    return <div className="my-2 flex flex-wrap gap-2 font-mono font-bold" data-role="common-divisors">
        {values.map(value => <span key={value} className="rounded-md border border-emerald-300 bg-white px-3 py-1">{value}</span>)}
    </div>;
}

function inconsistentMultipleProof(): never {
    throw new ViewValidationError('numbers-least-common-multiple', 'A positive LCM requires a defined GCD and coprime cofactors.');
}

export function FullCommonFactorBody({data, isSolutionView}: {data: FullCommonFactorDistributionProblem; isSolutionView: boolean}) {
    const [first, second] = data.addends;
    const [u, v] = data.residualAddends;
    return <Card title="Extract the full common factor">
        <p className="text-lg">Rewrite the sum using its greatest common factor. The two addends inside the parentheses must have no common factor greater than 1.</p>
        <Given>{first} + {second}</Given>
        {isSolutionView ? <Solution>
            <p>Common positive factors of {first} and {second}:</p>
            <DivisorList values={data.commonDivisors} />
            <p className="font-semibold">Greatest common factor: {data.gcd}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 font-mono font-semibold" data-role="distributed-products">
                <div>{data.distributedProducts[0]} = {data.gcd} × {u}</div><div>{data.distributedProducts[1]} = {data.gcd} × {v}</div>
            </div>
            <div className="mt-3 space-y-1 font-mono font-bold" data-role="distributive-expansion">
                <div>{first} + {second} = {data.gcd} × {u} + {data.gcd} × {v}</div>
                <div>= {data.gcd}({u} + {v}) = {data.gcd} × {data.residualSum} = {data.sum}</div>
            </div>
            <p className="mt-3" data-role="coprime-residuals">Common positive factors of {u} and {v}: {data.residualCommonDivisors.join(', ')}. The full common factor has been extracted.</p>
        </Solution> : <Workspace response="Factored sum: ______(______ + ______)" />}
    </Card>;
}

export function GreatestCommonFactorBody({data, isSolutionView}: {data: CommonFactorMultipleProblem; isSolutionView: boolean}) {
    const [first, second] = data.inputs;
    const witness = data.gcd;
    return <Card title="Find the greatest common factor">
        <p className="text-lg">Find the greatest positive common factor. If no greatest one exists, write “undefined.”</p>
        <Given>{first} and {second}</Given>
        {isSolutionView ? <Solution>{witness.kind === 'defined' ? <>
            <p>Common positive factors:</p><DivisorList values={witness.commonDivisors} />
            <p className="font-mono text-2xl font-bold" data-role="gcd-answer">GCD({first}, {second}) = {witness.value}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 font-mono" data-role="gcd-reconstruction">
                <div>{first} = {witness.value} × {witness.cofactors[0]}</div><div>{second} = {witness.value} × {witness.cofactors[1]}</div>
            </div>
        </> : <>
            <p className="font-mono text-2xl font-bold" data-role="gcd-answer">GCD(0, 0) is undefined.</p>
            <p className="mt-3">Every positive integer divides 0, so there is no greatest positive common divisor.</p>
        </>}</Solution> : <Workspace response="Greatest common factor: ____________________" />}
    </Card>;
}

export function LeastCommonMultipleBody({data, isSolutionView}: {data: CommonFactorMultipleProblem; isSolutionView: boolean}) {
    const [first, second] = data.inputs;
    const gcd = data.gcd;
    const witness = data.lcm;
    return <Card title="Find the least common multiple">
        <p className="text-lg">Find the least common multiple of the two whole numbers.</p>
        {!isSolutionView && data.inputs.includes(0) && <p className="mt-2 text-sm text-slate-600">Use the zero-input extension of LCM.</p>}
        <Given>{first} and {second}</Given>
        {isSolutionView ? <Solution>{witness.kind === 'positive' && gcd.kind === 'defined' ? <>
            <p className="font-mono font-semibold">GCD({first}, {second}) = {gcd.value}</p>
            <div className="mt-2 grid grid-cols-2 gap-3 font-mono" data-role="cofactor-reconstruction">
                <div>{first} = {gcd.value} × {gcd.cofactors[0]}</div><div>{second} = {gcd.value} × {gcd.cofactors[1]}</div>
            </div>
            <p className="mt-2" data-role="coprime-cofactors">Common positive factors of {gcd.cofactors[0]} and {gcd.cofactors[1]}: {gcd.cofactorCommonDivisors.join(', ')}. These cofactors are coprime.</p>
            <p className="mt-3 font-mono text-xl font-bold" data-role="lcm-answer">LCM({first}, {second}) = {gcd.value} × {gcd.cofactors[0]} × {gcd.cofactors[1]} = {witness.value}</p>
            <p className="mt-2">The coprime cofactors give the least positive common multiple.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 font-mono" data-role="common-products">
                <div>{first} × {witness.commonMultipliers[0]} = {witness.commonProducts[0]}</div>
                <div>{second} × {witness.commonMultipliers[1]} = {witness.commonProducts[1]}</div>
            </div>
        </> : witness.kind === 'zero-extension' ? <>
            <p className="font-mono text-2xl font-bold" data-role="lcm-answer">LCM({first}, {second}) = {witness.value}</p>
            <p className="mt-3">By the zero-input convention, the least common multiple is 0 whenever either input is 0.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 font-mono" data-role="zero-products">
                <div>{first} × 0 = {witness.zeroProducts[0]}</div><div>{second} × 0 = {witness.zeroProducts[1]}</div>
            </div>
        </> : inconsistentMultipleProof()}</Solution> : <Workspace response="Least common multiple: ____________________" />}
    </Card>;
}
