import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionArithmeticView} from '../fraction-arithmetic-view.tsx';
import {
    FractionsInterpretationModelViewConfig,
    FractionsInterpretationModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-interpretation-model';

interface CoreProps {
    config: FractionsInterpretationModelViewConfig;
    payload: ViewRenderPayload<'fractions-interpretation-model'>;
}

const FractionsInterpretationModelCore = ({payload}: CoreProps) => (
    <FractionArithmeticView
        layout="model"
        payload={payload}
        presentation="interpretation"
        viewId={VIEW_ID}
    />
);

export const FractionsInterpretationModel = withConfig(
    FractionsInterpretationModelViewSchema,
    FractionsInterpretationModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-interpretation-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsInterpretationModel payload={payload} />);
    }
};
