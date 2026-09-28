import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeEnvShapesViewConfig, ShapeEnvShapesViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeEnvShapesViewConfig;
    payload: ViewRenderPayload<'shape-env-shapes'>;
}

const objectImages = {
    clock: {src: '/icons/environment-objects/clock.png', subject: 'clock face', alt: 'A wall clock'},
    window: {src: '/icons/environment-objects/window.png', subject: 'window frame', alt: 'A window in a wall'},
    table: {src: '/icons/environment-objects/table.png', subject: 'tabletop', alt: 'A wooden table viewed from above'},
    pennant: {src: '/icons/environment-objects/pennant.png', subject: 'pennant', alt: 'A fabric pennant on a wooden staff'},
    'honeycomb cell': {src: '/icons/environment-objects/honeycomb.png', subject: 'opening of a honeycomb cell', alt: 'Open cells in a wax honeycomb'}
} as const;
const options = ['circle', 'square', 'rectangle', 'triangle', 'hexagon'];

export const ShapeEnvShapesCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-env-shapes', data, ['target', 'answer']);

    const target = data.target;
    const answer = data.answer;

    if (target !== 'table' && target !== 'window' && target !== 'clock' && target !== 'pennant' && target !== 'honeycomb cell') {
        throw new ViewValidationError('shape-env-shapes', `Unsupported target environment shape: ${target}`);
    }
    if (!options.includes(answer)) {
        throw new ViewValidationError('shape-env-shapes', `Unsupported shape answer: ${answer}`);
    }

    const objectImage = objectImages[target];
    const promptText = `What shape is the ${objectImage.subject}?`;

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        if (opt === answer && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        return opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>
                
                <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] overflow-hidden box-border">
                    <img src={objectImage.src} alt={objectImage.alt} width={480} height={320}
                        className="block w-full h-[320px] object-contain" />
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-center">
                    {options.map((opt, i) => (
                        <div key={i} className={getBtnClass(opt)}>
                            {getLabelText(opt)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ShapeEnvShapes = withConfig(ShapeEnvShapesViewSchema, ShapeEnvShapesCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'shape-env-shapes'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) {
                root = createRoot(container);
            }
            root.render(<ShapeEnvShapes payload={payload} />);
        }
    };
}
