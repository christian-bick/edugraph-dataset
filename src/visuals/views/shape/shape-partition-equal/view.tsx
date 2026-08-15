import {ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {FractionParts, FractionShape} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePartitionEqualViewConfig, ShapePartitionEqualViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapePartitionEqualViewConfig;
    payload: ViewRenderPayload<'shape-partition-equal'>;
}

const PART_WORDS: Record<FractionParts, string> = {
    2: 'two',
    3: 'three',
    4: 'four',
    6: 'six',
    8: 'eight'
};

function validateShape(shape: string): asserts shape is FractionShape {
    if (shape !== 'circle' && shape !== 'rectangle') {
        throw new ViewValidationError('shape-partition-equal', 'Expected a circle or rectangle.');
    }
}

function validateParts(parts: number): asserts parts is FractionParts {
    if (parts !== 2 && parts !== 3 && parts !== 4 && parts !== 6 && parts !== 8) {
        throw new ViewValidationError('shape-partition-equal', 'Expected 2, 3, 4, 6, or 8 equal parts.');
    }
}

function validateLegacyParts(parts: number): asserts parts is 2 | 4 {
    if (parts !== 2 && parts !== 4) {
        throw new ViewValidationError('shape-partition-equal', 'Expected two or four equal parts.');
    }
}

function circlePoint(angle: number, radius = 80): {x: number; y: number} {
    const radians = angle * Math.PI / 180;
    return {
        x: 150 + radius * Math.cos(radians),
        y: 100 + radius * Math.sin(radians)
    };
}

function circleSharePath(parts: FractionParts, index: number): string {
    if (parts === 2) {
        return [
            'M 150 100 L 150 20 A 80 80 0 0 0 150 180 Z',
            'M 150 100 L 150 20 A 80 80 0 0 1 150 180 Z'
        ][index];
    }
    if (parts === 4) {
        return [
            'M 150 100 L 150 20 A 80 80 0 0 1 230 100 Z',
            'M 150 100 L 230 100 A 80 80 0 0 1 150 180 Z',
            'M 150 100 L 150 180 A 80 80 0 0 1 70 100 Z',
            'M 150 100 L 70 100 A 80 80 0 0 1 150 20 Z'
        ][index];
    }
    const start = circlePoint(-90 + index * 360 / parts);
    const end = circlePoint(-90 + (index + 1) * 360 / parts);
    return `M 150 100 L ${start.x} ${start.y} A 80 80 0 0 1 ${end.x} ${end.y} Z`;
}

function CircleShare({parts, index, fill}: {parts: FractionParts; index: number; fill: string}) {
    return <path d={circleSharePath(parts, index)} fill={fill} />;
}

function RectangleShare({parts, index, fill}: {parts: FractionParts; index: number; fill: string}) {
    if (parts === 2) {
        return <rect x={45 + index * 105} y="35" width="105" height="130" fill={fill} />;
    }
    if (parts === 4) {
        const column = index % 2;
        const row = Math.floor(index / 2);
        return <rect x={45 + column * 105} y={35 + row * 65} width="105" height="65" fill={fill} />;
    }
    const columns = parts === 3 || parts === 6 ? 3 : 4;
    const rows = parts === 3 ? 1 : 2;
    const width = 210 / columns;
    const height = 130 / rows;
    const column = index % columns;
    const row = Math.floor(index / columns);
    return <rect x={45 + column * width} y={35 + row * height} width={width} height={height} fill={fill} />;
}

function DivisionLines({shape, parts, stroke}: {shape: FractionShape; parts: FractionParts; stroke: string}) {
    if (parts === 2 || parts === 4) {
        return (
            <>
                <line
                    x1="150"
                    y1={shape === 'circle' ? 20 : 35}
                    x2="150"
                    y2={shape === 'circle' ? 180 : 165}
                    stroke={stroke}
                    strokeWidth="5"
                />
                {parts === 4 && (
                    <line
                        x1={shape === 'circle' ? 70 : 45}
                        y1="100"
                        x2={shape === 'circle' ? 230 : 255}
                        y2="100"
                        stroke={stroke}
                        strokeWidth="5"
                    />
                )}
            </>
        );
    }
    if (shape === 'circle') {
        return <>{Array.from({length: parts}, (_, index) => {
            const point = circlePoint(-90 + index * 360 / parts);
            return <line key={index} x1="150" y1="100" x2={point.x} y2={point.y} stroke={stroke} strokeWidth="4" />;
        })}</>;
    }
    const columns = parts === 3 || parts === 6 ? 3 : 4;
    const rows = parts === 3 ? 1 : 2;
    return (
        <>
            {Array.from({length: columns - 1}, (_, index) => (
                <line
                    key={`column-${index}`}
                    x1={45 + (index + 1) * 210 / columns}
                    y1="35"
                    x2={45 + (index + 1) * 210 / columns}
                    y2="165"
                    stroke={stroke}
                    strokeWidth="4"
                />
            ))}
            {rows === 2 && <line x1="45" y1="100" x2="255" y2="100" stroke={stroke} strokeWidth="4" />}
        </>
    );
}

function ShareLabel({shape, parts, index, label}: {shape: FractionShape; parts: FractionParts; index: number; label: string}) {
    if (shape === 'circle') {
        const point = circlePoint(-90 + (index + 0.5) * 360 / parts, 48);
        return <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle" fill="#166534" fontSize="20" fontWeight="700">{label}</text>;
    }
    const columns = parts === 2 ? 2 : parts === 3 || parts === 6 ? 3 : parts === 4 ? 2 : 4;
    const rows = parts === 2 || parts === 3 ? 1 : 2;
    const column = index % columns;
    const row = Math.floor(index / columns);
    return (
        <text
            x={45 + (column + 0.5) * 210 / columns}
            y={35 + (row + 0.5) * 130 / rows}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#166534"
            fontSize="20"
            fontWeight="700"
        >
            {label}
        </text>
    );
}

function PartitionedShape({
    shape,
    parts,
    showDivisions,
    highlightedShare,
    highlightedShares,
    shareLabel,
    solvedHighlight = false
}: {
    shape: FractionShape;
    parts: FractionParts;
    showDivisions: boolean;
    highlightedShare?: number;
    highlightedShares?: number[];
    shareLabel?: {index: number; text: string};
    solvedHighlight?: boolean;
}) {
    const highlightFill = solvedHighlight ? '#dcfce7' : '#bfdbfe';
    const divisionStroke = solvedHighlight ? 'forestgreen' : '#475569';
    const selectedShares = highlightedShares ?? (highlightedShare === undefined ? [] : [highlightedShare]);
    return (
        <svg
            viewBox="0 0 300 200"
            className="w-[300px] h-[200px]"
            aria-label={`${shape} divided into ${PART_WORDS[parts]} equal parts`}
        >
            {shape === 'circle' ? (
                <>
                    <circle cx="150" cy="100" r="80" fill="#f8fafc" />
                    {selectedShares.map(index => <CircleShare key={index} parts={parts} index={index} fill={highlightFill} />)}
                    <circle cx="150" cy="100" r="80" fill="none" stroke="#334155" strokeWidth="5" />
                </>
            ) : (
                <>
                    <rect x="45" y="35" width="210" height="130" rx="4" fill="#f8fafc" />
                    {selectedShares.map(index => <RectangleShare key={index} parts={parts} index={index} fill={highlightFill} />)}
                    <rect x="45" y="35" width="210" height="130" rx="4" fill="none" stroke="#334155" strokeWidth="5" />
                </>
            )}
            {showDivisions && <DivisionLines shape={shape} parts={parts} stroke={divisionStroke} />}
            {shareLabel && <ShareLabel shape={shape} parts={parts} index={shareLabel.index} label={shareLabel.text} />}
        </svg>
    );
}

function SharePiece({shape, parts}: {shape: FractionShape; parts: FractionParts}) {
    return (
        <svg viewBox="0 0 100 100" className={parts === 2 ? 'w-[100px] h-[100px]' : 'w-[78px] h-[78px]'} aria-hidden="true">
            {shape === 'circle' ? (
                parts === 2
                    ? <path d="M 50 10 A 40 40 0 0 1 50 90 Z" fill="#dbeafe" stroke="#334155" strokeWidth="4" />
                    : <path d="M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z" fill="#dbeafe" stroke="#334155" strokeWidth="4" />
            ) : (
                <rect
                    x={parts === 2 ? 28 : 32}
                    y="12"
                    width={parts === 2 ? 44 : 36}
                    height="76"
                    rx="2"
                    fill="#fef3c7"
                    stroke="#334155"
                    strokeWidth="4"
                />
            )}
        </svg>
    );
}

function PromptSlot({children}: {isSolutionView: boolean; children: string}) {
    return (
        <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-snug px-4">
            {children}
        </div>
    );
}

function AnswerSlot({isSolutionView, answer}: {isSolutionView: boolean; answer: string}) {
    return (
        <div
            className={`h-[52px] min-w-[210px] px-6 rounded-xl border-2 flex items-center justify-center text-[1.2rem] font-bold box-border ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-transparent'
            }`}
            aria-label={isSolutionView ? `Answer: ${answer}` : 'Blank answer'}
        >
            {isSolutionView ? answer : '\u00a0'}
        </div>
    );
}

function ViewFrame({children}: {children: ReactNode}) {
    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[520px] h-[450px] gap-4">
                {children}
            </div>
        </div>
    );
}

const ShapePartitionEqualCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('shape-partition-equal', data, ['task', 'shape']);
    validateShape(data.shape);

    switch (data.task) {
        case 'partition': {
            validateProblemData('shape-partition-equal', data, ['parts']);
            validateLegacyParts(data.parts);
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>
                        {`Partition the shape into ${PART_WORDS[data.parts]} equal parts.`}
                    </PromptSlot>
                    <div className="w-[420px] h-[260px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center box-border">
                        <PartitionedShape shape={data.shape} parts={data.parts} showDivisions={isSolutionView} solvedHighlight={isSolutionView} />
                    </div>
                    <div className="h-[52px] px-6 rounded-xl bg-slate-100 text-[1.15rem] font-bold text-slate-600 flex items-center">
                        {PART_WORDS[data.parts]} equal parts
                    </div>
                </ViewFrame>
            );
        }
        case 'name-share': {
            validateProblemData('shape-partition-equal', data, ['parts', 'shareName', 'selectedShare', 'answer']);
            validateLegacyParts(data.parts);
            if (!Number.isInteger(data.selectedShare) || data.selectedShare < 0 || data.selectedShare >= data.parts) {
                throw new ViewValidationError('shape-partition-equal', 'The selected share must identify one of the equal parts.');
            }
            const hasMatchingShareName = data.parts === 2
                ? data.shareName === 'half'
                : data.shareName === 'fourth' || data.shareName === 'quarter';
            if (!hasMatchingShareName || data.answer !== data.shareName) {
                throw new ViewValidationError('shape-partition-equal', 'Expected a matching half, fourth, or quarter word answer.');
            }
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>What is the highlighted share called?</PromptSlot>
                    <div className="w-[420px] h-[260px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center box-border">
                        <PartitionedShape
                            shape={data.shape}
                            parts={data.parts}
                            showDivisions
                            highlightedShare={data.selectedShare}
                        />
                    </div>
                    <AnswerSlot isSolutionView={isSolutionView} answer={data.answer} />
                </ViewFrame>
            );
        }
        case 'compose-whole': {
            validateProblemData('shape-partition-equal', data, ['parts', 'shareName', 'answer']);
            validateLegacyParts(data.parts);
            const hasMatchingShareName = data.parts === 2
                ? data.shareName === 'half'
                : data.shareName === 'fourth';
            if (!hasMatchingShareName || data.answer !== 'one whole') {
                throw new ViewValidationError('shape-partition-equal', 'Expected halves or fourths that compose one whole.');
            }
            const pluralShareName = data.shareName === 'half' ? 'halves' : 'fourths';
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>
                        {`What do these ${pluralShareName} make?`}
                    </PromptSlot>
                    <div className="w-[420px] h-[260px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center box-border">
                        {isSolutionView ? (
                            <PartitionedShape shape={data.shape} parts={data.parts} showDivisions solvedHighlight />
                        ) : (
                            <div className="flex items-center justify-center gap-2" aria-label={`${PART_WORDS[data.parts]} separate ${pluralShareName}`}>
                                {Array.from({length: data.parts}, (_, index) => (
                                    <SharePiece key={index} shape={data.shape} parts={data.parts} />
                                ))}
                            </div>
                        )}
                    </div>
                    <AnswerSlot isSolutionView={isSolutionView} answer={data.answer} />
                </ViewFrame>
            );
        }
        case 'compare-share-size': {
            validateProblemData('shape-partition-equal', data, ['shares', 'relation', 'answer']);
            if (
                data.shares.length !== 2
                || data.shares[0].parts !== 2
                || data.shares[0].shareName !== 'half'
                || data.shares[1].parts !== 4
                || data.shares[1].shareName !== 'fourth'
                || data.relation !== 'less'
                || data.answer !== 'fourth'
            ) {
                throw new ViewValidationError('shape-partition-equal', 'Expected a smaller-share comparison between a half and a fourth.');
            }
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>Which share is smaller?</PromptSlot>
                    <div className="w-[480px] h-[260px] flex items-stretch justify-center gap-4">
                        {data.shares.map(share => {
                            const isAnswer = share.shareName === data.answer;
                            return (
                                <div
                                    key={share.shareName}
                                    className={`w-[230px] h-full rounded-xl border-2 flex flex-col items-center justify-center box-border ${
                                        isSolutionView && isAnswer
                                            ? 'border-emerald-600 bg-emerald-50'
                                            : 'border-slate-200 bg-slate-50'
                                    }`}
                                >
                                    <div className="scale-[0.66] -my-[32px]">
                                        <PartitionedShape
                                            shape={data.shape}
                                            parts={share.parts}
                                            showDivisions
                                            highlightedShare={0}
                                            solvedHighlight={isSolutionView && isAnswer}
                                        />
                                    </div>
                                    <div className={`text-[1.1rem] font-bold ${isSolutionView && isAnswer ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        {share.shareName}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ViewFrame>
            );
        }
        case 'partition-and-label-unit-fraction': {
            validateProblemData('shape-partition-equal', data, ['parts', 'selectedShare', 'unitFraction', 'answer']);
            validateParts(data.parts);
            if (
                !Number.isInteger(data.selectedShare)
                || data.selectedShare < 0
                || data.selectedShare >= data.parts
                || data.unitFraction !== `1/${data.parts}`
                || data.answer !== `${data.unitFraction} of the whole`
            ) {
                throw new ViewValidationError('shape-partition-equal', 'Expected one valid part labeled with its unit fraction.');
            }
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>
                        {`Partition the shape into ${PART_WORDS[data.parts]} equal parts and label one part ${data.unitFraction}.`}
                    </PromptSlot>
                    <div className="w-[420px] h-[260px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center box-border">
                        <PartitionedShape
                            shape={data.shape}
                            parts={data.parts}
                            showDivisions={isSolutionView}
                            highlightedShare={isSolutionView ? data.selectedShare : undefined}
                            shareLabel={isSolutionView ? {index: data.selectedShare, text: data.unitFraction} : undefined}
                            solvedHighlight={isSolutionView}
                        />
                    </div>
                    <AnswerSlot isSolutionView={isSolutionView} answer={data.answer} />
                </ViewFrame>
            );
        }
        case 'interpret-fraction': {
            validateProblemData('shape-partition-equal', data, [
                'parts',
                'numerator',
                'highlightedShares',
                'unitFraction',
                'fraction',
                'answer'
            ]);
            validateParts(data.parts);
            const expectedShares = Array.from({length: data.numerator}, (_, index) => index);
            if (
                !Number.isInteger(data.numerator)
                || data.numerator < 1
                || data.numerator >= data.parts
                || data.highlightedShares.length !== expectedShares.length
                || data.highlightedShares.some((share, index) => share !== expectedShares[index])
                || data.unitFraction !== `1/${data.parts}`
                || data.fraction !== `${data.numerator}/${data.parts}`
                || data.answer !== data.fraction
            ) {
                throw new ViewValidationError('shape-partition-equal', 'Expected a fraction matching the highlighted equal parts.');
            }
            return (
                <ViewFrame>
                    <PromptSlot isSolutionView={isSolutionView}>What fraction of the whole is highlighted?</PromptSlot>
                    <div className="w-[420px] h-[260px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center box-border">
                        <PartitionedShape
                            shape={data.shape}
                            parts={data.parts}
                            showDivisions
                            highlightedShares={data.highlightedShares}
                            solvedHighlight={isSolutionView}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <AnswerSlot isSolutionView={isSolutionView} answer={data.answer} />
                        <div className={`h-[20px] text-sm font-semibold ${isSolutionView ? 'text-slate-600' : 'text-transparent'}`}>
                            {`${data.numerator} equal ${data.numerator === 1 ? 'part' : 'parts'} of size ${data.unitFraction}`}
                        </div>
                    </div>
                </ViewFrame>
            );
        }
        default:
            throw new ViewValidationError('shape-partition-equal', `Unsupported task: ${String((data as {task: unknown}).task)}`);
    }
};

export const ShapePartitionEqual = withConfig(ShapePartitionEqualViewSchema, ShapePartitionEqualCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-partition-equal'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePartitionEqual payload={payload} />);
    }
};
