import type {AlgebraicDomainBound, AlgebraicInequalityProblem, AlgebraicScalar} from '../../../types/problems.ts';
import {exactNumericValue} from './numerical-power-expression-format.tsx';

const key = (value: AlgebraicScalar) => `${value.numerator}/${value.denominator}`;
/** Maps supplied tick/located-set facts only. It does not construct an intersection or a value. */
export function StatementSolutionLine({data, isSolutionView, seed}: {data: AlgebraicInequalityProblem; isSolutionView: boolean; seed: number}) {
    const {axis, boundary, auxiliaryLocations} = data.solutionLine;
    const vertical = Math.abs(seed % 2) === 1;
    const labels = axis.ticks.map(exactNumericValue), labelWidth = Math.max(...labels.map(value => value.length)) * 8;
    const margin = Math.max(65, labelWidth / 2 + 20);
    const width = vertical ? Math.max(740, labelWidth * 2 + 150) : Math.max(740, (labels.length - 1) * Math.max(52, labelWidth + 16) + margin * 2);
    const height = vertical ? Math.max(590, (labels.length - 1) * 45 + 130) : 190;
    const low = vertical ? height - 65 : margin, high = vertical ? 55 : width - margin;
    const position = (index: number) => low + index * (high - low) / (labels.length - 1);
    const x = (position: number) => vertical ? width / 2 : position;
    const y = (position: number) => vertical ? position : 80;
    const locations = new Map([boundary, ...auxiliaryLocations].map(location => [key(location.value), location.tickIndex]));
    const at = (value: AlgebraicScalar) => position(locations.get(key(value))!);
    const green = '#047857';
    const marker = (value: AlgebraicScalar, included: boolean, role: string) => <circle key={`${role}-${key(value)}`} cx={x(at(value))} cy={y(at(value))} r="6" stroke={green} strokeWidth="2.5" fill={included ? green : 'white'} data-role={role} data-tick-index={locations.get(key(value))} data-included={included} />;
    const arrow = (end: number, direction: 'less' | 'greater', role: string, color = green) => {
        const delta = (vertical ? -1 : 1) * (direction === 'greater' ? 1 : -1), back = end - delta * 10;
        return <polygon points={vertical ? `${x(end)},${end} ${x(end) - 5},${back} ${x(end) + 5},${back}` : `${end},${y(end)} ${back},${y(end) - 5} ${back},${y(end) + 5}`} fill={color} data-role={role} />;
    };
    const region = (lower: AlgebraicDomainBound | null, upper: AlgebraicDomainBound | null, exclusions: readonly AlgebraicScalar[]) => {
        const start = lower ? at(lower.value) : low + (vertical ? 20 : -20), end = upper ? at(upper.value) : high + (vertical ? -20 : 20);
        return <g data-role="solution-region"><line x1={x(start)} y1={y(start)} x2={x(end)} y2={y(end)} stroke={green} strokeWidth="5" />
            {lower ? marker(lower.value, lower.inclusive, 'solution-endpoint') : arrow(start, 'less', 'solution-ray-arrow')}
            {upper ? marker(upper.value, upper.inclusive, 'solution-endpoint') : arrow(end, 'greater', 'solution-ray-arrow')}
            {exclusions.filter(value => locations.has(key(value)) && at(value) >= Math.min(start, end) && at(value) <= Math.max(start, end)).map(value => marker(value, false, 'solution-exclusion'))}</g>;
    };
    const solution = data.ambientSolution;
    const marks = solution.kind === 'empty' ? null
        : solution.kind === 'singleton' ? marker(solution.value, true, 'solution-member')
            : solution.kind === 'finite' ? solution.values.map(value => marker(value, true, 'solution-member'))
                : solution.kind === 'ray' ? region(solution.direction === 'greater' ? {value: solution.boundary, inclusive: false} : null, solution.direction === 'less' ? {value: solution.boundary, inclusive: false} : null, [])
                    : solution.kind === 'interval' ? region(solution.lower, solution.upper, solution.excludedValues)
                        : data.ambientDomain.kind === 'finite' ? data.ambientDomain.values.map(value => marker(value, true, 'solution-member'))
                            : region(data.ambientDomain.values.lower, data.ambientDomain.values.upper, data.ambientDomain.values.excludedValues);
    return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><svg viewBox={`0 0 ${width} ${height}`} style={{width: '100%', display: 'block'}} aria-label="Scaled solution number line" data-role="statement-numberline" data-orientation={vertical ? 'vertical' : 'horizontal'}>
        <line x1={x(low + (vertical ? 20 : -20))} y1={y(low + (vertical ? 20 : -20))} x2={x(high + (vertical ? -20 : 20))} y2={y(high + (vertical ? -20 : 20))} stroke="#475569" strokeWidth="2" />
        {arrow(low + (vertical ? 25 : -25), 'less', 'scale-arrow', '#475569')}{arrow(high + (vertical ? -25 : 25), 'greater', 'scale-arrow', '#475569')}
        {labels.map((label, index) => <g key={index}><line x1={x(position(index)) - (vertical ? 5 : 0)} x2={x(position(index)) + (vertical ? 5 : 0)} y1={y(position(index)) - (vertical ? 0 : 5)} y2={y(position(index)) + (vertical ? 0 : 5)} stroke="#475569" />
            <text x={x(position(index)) - (vertical ? 17 : 0)} y={y(position(index)) + (vertical ? 5 : 29)} textAnchor={vertical ? 'end' : 'middle'} fill="#334155" fontSize="14" data-role="statement-tick" data-tick-index={index}>{label}</text></g>)}
        {isSolutionView && <g data-role="statement-solution-marks">{marks}</g>}
        <text x={width / 2} y={height - 15} textAnchor="middle" fill="#475569" fontSize="14">Step: {exactNumericValue(axis.step)}</text>
    </svg></div>;
}
