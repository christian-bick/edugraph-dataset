import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {ArithmeticLawExercise} from './arithmetic-law-view.tsx';
import {
    getAppleGroups,
    getUnknownPart,
    getWordProblemText,
    UnknownPart
} from './arithmetic-word-problem-helpers.ts';

interface ArithmeticWordProblemViewProps {
    invertProcedure: boolean;
    payload: ViewRenderPayload<'operations-word-problem' | 'operations-word-problem-inversion'>;
}

function AppleGroup({
    title,
    part,
    value,
    hidden,
    highlighted
}: {
    title: string;
    part: 'num1' | 'num2' | 'num3';
    value: number;
    hidden: boolean;
    highlighted: boolean;
}) {
    return (
        <div className={`flex h-[108px] w-[140px] flex-col items-center justify-center rounded-xl border-2 bg-white px-2 py-2 ${
            highlighted ? 'border-emerald-600 bg-emerald-50' : hidden ? 'border-dashed border-slate-400' : 'border-slate-300'
        }`}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</div>
            {hidden ? (
                <div className="text-3xl font-bold text-slate-400">?</div>
            ) : (
                <div className={`grid gap-[3px] ${value <= 12 ? 'grid-cols-4' : 'grid-cols-5'}`} aria-label={`${value} ${title.toLowerCase()}`}>
                    {Array.from({length: value}, (_, index) => (
                        <span
                            key={index}
                            className={`relative block size-[13px] rounded-full border border-black/15 ${
                                part === 'num1'
                                    ? 'bg-red-500'
                                    : part === 'num2'
                                        ? 'bg-green-500'
                                        : 'bg-yellow-400'
                            }`}
                        >
                            <span className="absolute -right-px -top-[3px] h-[5px] w-[3px] rotate-45 rounded-full bg-green-700" />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

const operatorSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

function distributiveStory(
    data: ArithmeticTripleProblem,
    unknownPart: UnknownPart
): string {
    const visible = (part: UnknownPart, value: number): number | string =>
        part === unknownPart ? (part === 'answer' ? 'an unknown number of' : 'some') : value;
    return `A tiled display has ${visible('num1', data.num1)} rows. Each row is split into ${visible('num2', data.num2)} blue squares and ${visible('num3', data.num3)} yellow squares, for ${data.combinedFactor} squares per row. There are ${visible('answer', data.answer)} squares altogether. Find the unknown amount using the distributive property.`;
}

export const ArithmeticWordProblemView = ({invertProcedure, payload}: ArithmeticWordProblemViewProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('operations-word-problem', data, ['num1', 'num2', 'operation', 'answer']);

    const operation = data.operation;
    const symbol = operatorSymbols[operation];
    if (!symbol) {
        throw new ViewValidationError('operations-word-problem', `Unsupported operation: ${operation}`);
    }

    const hasThirdOperand = data.num3 !== undefined;
    if (hasThirdOperand) {
        validateProblemData('operations-word-problem', data, ['num3']);
    }

    const num1 = data.num1;
    const num2 = data.num2;
    const num3 = data.num3;
    const answer = data.answer;
    const appleGroups = getAppleGroups(data);
    if (appleGroups.some(group =>
        !Number.isInteger(group.value) || group.value < 0 || group.value > 20
    )) {
        throw new ViewValidationError(
            'operations-word-problem',
            'Apple groups require whole-number quantities from 0 through 20.'
        );
    }
    const unknownPart = getUnknownPart(data, payload.seed, invertProcedure);
    const textScenario = data.propertyLaw === 'distributive'
        ? distributiveStory(data as ArithmeticTripleProblem, unknownPart)
        : getWordProblemText(data, unknownPart);
    const appleGroupTitle = (part: 'num1' | 'num2' | 'num3', label: string): string => {
        if (operation === 'addition' && hasThirdOperand) {
            return part === 'num1' ? 'Red apples' : part === 'num2' ? 'Green apples' : 'Yellow apples';
        }
        if (!hasThirdOperand && operation === 'subtraction') {
            return part === 'num1' ? 'Starting apples' : 'Given away';
        }
        if (!hasThirdOperand && operation === 'addition') {
            return part === 'num1' ? 'Starting apples' : 'Added apples';
        }
        return `Amount ${label}`;
    };

    const getInputClass = (part: UnknownPart, isFinal = false) => {
        let cls = "w-[60px] h-[60px] border-2 border-slate-500 rounded-lg flex justify-center items-center text-[2rem] font-mono bg-white ";
        if (isSolutionView && part === unknownPart) {
            cls += "text-green-600 border-green-600 bg-green-50 font-bold ";
        } else {
            cls += "text-slate-800 ";
        }
        if (isFinal) {
            cls += "border-[3px]";
        }
        return cls;
    };

    const boxContent = (part: UnknownPart, value: number) => {
        return !isSolutionView && part === unknownPart ? '' : value;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="flex h-[128px] w-full items-center justify-center box-border">
                    <div className="flex h-full w-full items-center justify-center rounded-lg border-l-4 border-sky-500 bg-slate-50 p-[15px] text-center text-xl font-bold leading-relaxed text-slate-700">
                        {textScenario}
                    </div>
                </div>

                {!data.propertyLaw && <div className="mt-4 flex items-center gap-3">
                    {appleGroups.map(({label, part, value}) => (
                        <AppleGroup
                            key={part}
                            title={appleGroupTitle(part, label)}
                            part={part}
                            value={value}
                            hidden={!isSolutionView && part === unknownPart}
                            highlighted={isSolutionView && part === unknownPart}
                        />
                    ))}
                </div>}

                {data.propertyLaw ? (
                    <div className="mt-4 w-full">
                        <ArithmeticLawExercise
                            data={data as ArithmeticTripleProblem}
                            unknown={unknownPart}
                            isSolutionView={isSolutionView}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mt-4">
                        <div className={getInputClass('num1')}>{boxContent('num1', num1)}</div>
                        <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                        <div className={getInputClass('num2')}>{boxContent('num2', num2)}</div>
                        {num3 !== undefined && (
                            <>
                                <div className="text-[2rem] font-extrabold text-slate-500">{symbol}</div>
                                <div className={getInputClass('num3')}>{boxContent('num3', num3)}</div>
                            </>
                        )}
                        <div className="text-[2rem] font-extrabold text-slate-500">=</div>
                        <div className={getInputClass('answer', true)}>{boxContent('answer', answer)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
