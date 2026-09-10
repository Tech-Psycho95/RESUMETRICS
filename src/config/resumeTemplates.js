import ClassicProfessionalTemplate from '../components/templates/ClassicProfessionalTemplate.jsx'
import ModernMinimalTemplate from '../components/templates/ModernMinimalTemplate.jsx'
import TechFocusedTemplate from '../components/templates/TechFocusedTemplate.jsx'
import CompactATSTemplate from '../components/templates/CompactATSTemplate.jsx'
import ElegantSidebarTemplate from '../components/templates/ElegantSidebarTemplate.jsx'

export const resumeTemplates = [
  { id: 'classic-professional', name: 'Classic Professional', description: 'Clean ATS-friendly layout for internships and early-career roles.', category: 'ATS', component: ClassicProfessionalTemplate },
  { id: 'modern-minimal', name: 'Modern Minimal', description: 'Simple hierarchy with generous whitespace and a contemporary feel.', category: 'Minimal', component: ModernMinimalTemplate },
  { id: 'tech-focused', name: 'Tech Focused', description: 'Skills-forward structure for technical projects and developer roles.', category: 'Tech', component: TechFocusedTemplate },
  { id: 'compact-ats', name: 'Compact ATS', description: 'Dense, readable single-column format for high-signal applications.', category: 'ATS', component: CompactATSTemplate },
  { id: 'elegant-sidebar', name: 'Elegant Sidebar', description: 'Balanced two-column layout for a polished, detailed profile.', category: 'Creative', component: ElegantSidebarTemplate }
]

