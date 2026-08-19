import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersFactorsMultiplesView} from '../factors-multiples-view.tsx';
import {NumbersPrimeClassificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {payload: ViewRenderPayload<'numbers-prime-classification'>}
const Core = ({payload}: CoreProps) => (
    <NumbersFactorsMultiplesView expectedKinds={['prime-classification']} payload={payload} />
);
export const NumbersPrimeClassification = withConfig(NumbersPrimeClassificationViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'numbers-prime-classification'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersPrimeClassification payload={payload} />);
};
