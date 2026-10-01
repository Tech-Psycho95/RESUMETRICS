import ResumeTemplateLayout from './ResumeTemplateLayout.jsx'
import './reactive-templates.css'

// Adapted from the MIT-licensed Reactive Resume template family
// (https://github.com/AmruthPillai/Reactive-Resume, packages/pdf/src/templates).
// Each design is recreated on the shared Resumetrics layout so it keeps the
// existing resume data, editing and pagination pipeline.
export const createReactiveTemplate = variant => function ReactiveResumeTemplate(props) {
  return <ResumeTemplateLayout {...props} variant={variant} />
}

export const AzurillTemplate = createReactiveTemplate('azurill')
export const BronzorTemplate = createReactiveTemplate('bronzor')
export const ChikoritaTemplate = createReactiveTemplate('chikorita')
export const DitgarTemplate = createReactiveTemplate('ditgar')
export const DittoTemplate = createReactiveTemplate('ditto')
export const GengarTemplate = createReactiveTemplate('gengar')
export const GlalieTemplate = createReactiveTemplate('glalie')
export const KakunaTemplate = createReactiveTemplate('kakuna')
export const LaprasTemplate = createReactiveTemplate('lapras')
export const LeafishTemplate = createReactiveTemplate('leafish')
export const MeowthTemplate = createReactiveTemplate('meowth')
export const OnyxTemplate = createReactiveTemplate('onyx')
export const PikachuTemplate = createReactiveTemplate('pikachu')
export const RhyhornTemplate = createReactiveTemplate('rhyhorn')
export const ScizorTemplate = createReactiveTemplate('scizor')
