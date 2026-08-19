import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionArithmeticView} from '../fraction-arithmetic-view.tsx';
import {
    FractionsUnderstandingModelViewConfig,
    FractionsUnderstandingModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-understanding-model';

interface CoreProps {
    config: FractionsUnderstandingModelViewConfig;
    payload: ViewRenderPayload<'fractions-understanding-model'>;
}

const FractionsUnderstandingModelCore = ({payload}: CoreProps) => (
    <FractionArithmeticView
        layout="model"
        payload={payload}
        presentation="understanding"
        viewId={VIEW_ID}
    />
);

export const FractionsUnderstandingModel = withConfig(
    FractionsUnderstandingModelViewSchema,
    FractionsUnderstandingModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-understanding-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsUnderstandingModel payload={payload} />);
    }
};
