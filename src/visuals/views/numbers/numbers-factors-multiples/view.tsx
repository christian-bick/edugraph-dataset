import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersFactorsMultiplesView} from '../factors-multiples-view.tsx';
import {NumbersFactorsMultiplesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    payload: ViewRenderPayload<'numbers-factors-multiples'>;
}

const Core = ({payload}: CoreProps) => (
    <NumbersFactorsMultiplesView
        expectedKinds={['factor-pairs', 'one-digit-multiple-test']}
        payload={payload}
    />
);

export const NumbersFactorsMultiples = withConfig(NumbersFactorsMultiplesViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'numbers-factors-multiples'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersFactorsMultiples payload={payload} />);
};
