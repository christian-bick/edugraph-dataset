import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsPropertiesViewConfig, OperationsPropertiesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsPropertiesViewConfig;
    payload: ViewRenderPayload<'operations-properties'>;
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

const OperationsPropertiesCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-properties', data, ['num1', 'num2', 'operation', 'answer', 'propertyLaw']);

    if (data.operation !== 'addition' && data.operation !== 'multiplication') {
        throw new ViewValidationError('operations-properties', 'Arithmetic properties require addition or multiplication.');
    }
    if (data.propertyLaw !== 'commutative'
        && data.propertyLaw !== 'associative'
        && data.propertyLaw !== 'distributive') {
        throw new ViewValidationError('operations-properties', 'Unsupported arithmetic property.');
    }
    validateProblemData('operations-properties', data, ['num3']);

    const values = [data.num1, data.num2, data.num3, data.answer];
    if (values.some(value => !Number.isInteger(value) || value < 0 || value > 100)) {
        throw new ViewValidationError('operations-properties', 'This view supports whole-number values from 0 through 100.');
    }

    if (data.propertyLaw === 'distributive') {
        validateProblemData('operations-properties', data, ['combinedFactor', 'partialProducts']);
        const combinedFactor = data.combinedFactor!;
        const partialProducts = data.partialProducts!;
        if (data.operation !== 'multiplication'
            || combinedFactor !== data.num2 + data.num3
            || partialProducts.length !== 2
            || partialProducts[0] !== data.num1 * data.num2
            || partialProducts[1] !== data.num1 * data.num3
            || data.answer !== partialProducts[0] + partialProducts[1]) {
            throw new ViewValidationError('operations-properties', 'The distributive decomposition must be mathematically consistent.');
        }
    }

    const distributiveData = data.propertyLaw === 'distributive'
        ? {combinedFactor: data.combinedFactor!, partialProducts: data.partialProducts!}
        : undefined;

    const missingValue = isSolutionView
        ? (data.propertyLaw === 'commutative' ? data.num1 : data.num3)
        : undefined;
    const title = data.propertyLaw === 'commutative'
        ? 'Commutative property'
        : data.propertyLaw === 'associative'
            ? 'Associative property'
            : 'Distributive property';
    const symbol = data.operation === 'addition' ? '+' : '×';

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[650px]">
                <div className="h-[34px] mb-3 text-[1.3rem] font-bold text-slate-700 text-center font-sans">
                    {!isSolutionView && 'Complete the equation to show the property.'}
                </div>
                <div className="mb-6 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-semibold font-sans">
                    {title}
                </div>
                {data.propertyLaw === 'distributive' ? (
                    <div className="flex flex-col items-center gap-5 font-mono text-[1.65rem] font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                            <span>{data.num1} × ({data.num2} + {data.num3})</span>
                            <span>=</span>
                            <span>{data.num1} × {distributiveData!.combinedFactor}</span>
                            <span>=</span>
                            <ValueBox value={isSolutionView ? data.answer : undefined} highlighted={isSolutionView} />
                        </div>
                        <div className="text-sm font-bold uppercase tracking-wider text-indigo-600">Distribute the factor</div>
                        <div className="flex items-center gap-2">
                            <span>({data.num1} × {data.num2}) + ({data.num1} × {data.num3})</span>
                            <span>=</span>
                            <span>{distributiveData!.partialProducts[0]} + {distributiveData!.partialProducts[1]}</span>
                            <span>=</span>
                            <ValueBox value={isSolutionView ? data.answer : undefined} highlighted={isSolutionView} />
                        </div>
                    </div>
                ) : data.propertyLaw === 'commutative' ? (
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
                        <ValueBox value={missingValue} highlighted={isSolutionView} />
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
                        <ValueBox value={missingValue} highlighted={isSolutionView} />
                        <span>)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const OperationsProperties = withConfig(OperationsPropertiesViewSchema, OperationsPropertiesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-properties'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsProperties payload={payload} />);
    }
};
