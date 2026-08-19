import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionLineView} from '../fraction-line-view.tsx';
import {NumbersFractionLineViewConfig, NumbersFractionLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersFractionLineViewConfig;
    payload: ViewRenderPayload<'numbers-fraction-line'>;
}

const NumbersFractionLineCore = ({payload}: CoreProps) => (
    <FractionLineView mode="articulation" payload={payload} />
);

export const NumbersFractionLine = withConfig(
    NumbersFractionLineViewSchema,
    NumbersFractionLineCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-fraction-line'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersFractionLine payload={payload} />);
    }
};
