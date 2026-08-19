import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersFactorsMultiplesView} from '../factors-multiples-view.tsx';
import {NumbersCompositeClassificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {payload: ViewRenderPayload<'numbers-composite-classification'>}
const Core = ({payload}: CoreProps) => (
    <NumbersFactorsMultiplesView expectedKinds={['composite-classification']} payload={payload} />
);
export const NumbersCompositeClassification = withConfig(NumbersCompositeClassificationViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'numbers-composite-classification'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersCompositeClassification payload={payload} />);
};
