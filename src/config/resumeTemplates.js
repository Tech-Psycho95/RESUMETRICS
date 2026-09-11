import ClassicProfessionalTemplate from '../components/templates/ClassicProfessionalTemplate.jsx'
import ModernMinimalTemplate from '../components/templates/ModernMinimalTemplate.jsx'
import TechFocusedTemplate from '../components/templates/TechFocusedTemplate.jsx'
import CompactATSTemplate from '../components/templates/CompactATSTemplate.jsx'
import ElegantSidebarTemplate from '../components/templates/ElegantSidebarTemplate.jsx'

export const resumeTemplates = [
  { id: 'classic-professional', name: 'Classic Professional', description: 'Clean single-column layout optimized for ATS readability.', category: 'ATS', atsFriendly: true, component: ClassicProfessionalTemplate },
  { id: 'modern-minimal', name: 'Modern Minimal', description: 'Contemporary hierarchy with clear, standard resume sections.', category: 'Minimal', atsFriendly: true, component: ModernMinimalTemplate },
  { id: 'tech-focused', name: 'Tech Focused', description: 'Technical emphasis with a logical, parser-friendly reading order.', category: 'Tech', atsFriendly: true, component: TechFocusedTemplate },
  { id: 'compact-ats', name: 'Compact ATS', description: 'Dense, readable single-column format for high-signal applications.', category: 'ATS', atsFriendly: true, component: CompactATSTemplate },
  { id: 'elegant-sidebar', name: 'Elegant Sidebar', description: 'Refined left accent with a clean single-column document flow.', category: 'Professional', atsFriendly: true, component: ElegantSidebarTemplate }
]
