import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {FractionArithmeticProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    FractionArithmeticText,
    FractionArithmeticWork
} from '../fraction-arithmetic-components.tsx';
import {isValidFractionArithmeticProblem} from '../fraction-arithmetic-helpers.ts';
import {
    FractionsOperationModelViewConfig,
    FractionsOperationModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-operation-model';

interface CoreProps {
    config: FractionsOperationModelViewConfig;
    payload: ViewRenderPayload<'fractions-operation-model'>;
}

const validateData = (data: FractionArithmeticProblem) => {
    validateProblemData(VIEW_ID, data, [
        'task',
        'operation',
        'denominator',
        'sharedWhole',
        'referenceId',
        'story',
        'prompt',
        'questionEquation',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    if (data.task === 'tenths-hundredths-addition') {
        validateProblemData(VIEW_ID, data, [
            'firstTenths',
            'secondHundredths',
            'convertedFirst',
            'result',
            'conversion',
            'conversionEquation',
            'solutionEquation',
            'equationChain',
            'questionModels',
            'solutionModels'
        ]);
    } else if (data.operation === 'multiplication') {
        validateProblemData(VIEW_ID, data, [
            'productKind',
            'wholeFactor',
            'wholeFactorDisplay',
            'unitFraction',
            'product',
            'groupCount',
            'partsPerGroup',
            'totalUnitParts',
            'solutionModel',
            'solutionEquation',
            'equationChain'
        ]);
        if (data.task === 'unit-fraction-multiple') {
            validateProblemData(VIEW_ID, data, [
                'questionModel',
                'unitSizeStatement',
                'unitMultipleEquation'
            ]);
        } else {
            validateProblemData(VIEW_ID, data, [
                'fractionFactor',
                'questionGroupModels',
                'fractionAsUnitMultipleEquation',
                'iteratedUnitEquation'
            ]);
        }
        if (data.task === 'fraction-multiplication-problem') {
            validateProblemData(VIEW_ID, data, [
                'lowerWhole',
                'upperWhole',
                'boundsStatement'
            ]);
        }
    } else if (data.task === 'interpret-operation' || data.task === 'fraction-operation') {
        validateProblemData(VIEW_ID, data, [
            'symbol',
            'action',
            'first',
            'second',
            'result',
            'questionModels',
            'solutionEquation',
            'solutionModel'
        ]);
    } else if (data.task === 'decompose') {
        validateProblemData(VIEW_ID, data, [
            'sourceKind',
            'sourceFraction',
            'sourceDisplay',
            'sourceModel',
            'decompositions',
            'solutionEquations'
        ]);
    } else if (data.task === 'mixed-operation') {
        validateProblemData(VIEW_ID, data, [
            'symbol',
            'strategy',
            'requiresRegrouping',
            'first',
            'second',
            'result',
            'questionModels',
            'operandConversionEquations',
            'improperOperationEquation',
            'normalizationEquation',
            'transformationSteps',
            'solutionEquation',
            'solutionModel'
        ]);
    }
    if (!isValidFractionArithmeticProblem(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Fraction arithmetic data must contain one coherent same-whole model, equation, story, and answer.'
        );
    }
};

const FractionsOperationModelCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateData(data);

    return (
        <div className="w-[980px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.4rem] font-extrabold leading-snug text-slate-800">
                <FractionArithmeticText text={data.prompt} />
            </div>
            <div className="mt-3 text-center text-sm font-bold text-slate-500">
                {data.task === 'tenths-hundredths-addition'
                    ? `Both grids represent ${data.story.wholeLabel}, shown first in tenths and then in hundredths.`
                    : `Every frame represents ${data.story.wholeLabel} divided into ${data.denominator} equal parts.`}
            </div>

            <div className="mt-5">
                <FractionArithmeticWork data={data} isSolutionView={isSolutionView} />
            </div>

            <div className={`mt-5 min-h-[88px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-extrabold">
                            <FractionArithmeticText text={data.answerStatement} />
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-snug">
                            <FractionArithmeticText text={data.explanation} />
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-[54px] items-center justify-center text-base font-bold">
                        Complete the missing {data.story.unknownRole === 'operation'
                            ? 'operation and equation'
                            : data.story.unknownRole === 'decompositions'
                                ? 'decompositions'
                                : data.story.unknownRole === 'multiplier'
                                    ? 'multiplier'
                                : 'result'}.
                    </div>
                )}
            </div>
        </div>
    );
};

export const FractionsOperationModel = withConfig(
    FractionsOperationModelViewSchema,
    FractionsOperationModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-operation-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsOperationModel payload={payload} />);
    }
};
