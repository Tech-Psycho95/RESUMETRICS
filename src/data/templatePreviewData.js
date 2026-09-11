export const templatePreviewResumeData = {
  fullName: 'John Doe',
  headline: 'Software Engineer',
  email: 'john.doe@email.com',
  phone: '+1 555 123 4567',
  location: 'New York, NY',
  links: [
    { label: 'linkedin.com/in/johndoe', url: 'linkedin.com/in/johndoe' },
    { label: 'github.com/johndoe', url: 'github.com/johndoe' }
  ],
  summary: 'Software engineer with experience building scalable web applications and cloud-based systems. Skilled in modern frontend development, backend APIs, databases, and software engineering best practices.',
  experience: [
    { role: 'Software Engineer', company: 'Acme Technologies', location: '', startDate: '2023', endDate: 'Present', bullets: ['Built scalable web applications using React and TypeScript.', 'Developed REST APIs and backend services.', 'Improved application performance and reliability.', 'Collaborated with cross-functional product and engineering teams.'] },
    { role: 'Software Engineering Intern', company: 'Tech Labs', location: '', startDate: '2022', endDate: '2023', bullets: ['Developed reusable frontend components.', 'Integrated APIs into production applications.', 'Fixed bugs and improved application usability.'] }
  ],
  projects: [
    { name: 'AI Resume Analyzer', techStack: [], description: '', bullets: ['Built an AI-powered resume analysis platform.', 'Implemented resume parsing and job-description matching.', 'Added evidence-based resume recommendations.'] },
    { name: 'Developer Dashboard', techStack: [], description: '', bullets: ['Built a responsive developer analytics dashboard.', 'Integrated external APIs and authentication.'] }
  ],
  education: [{ degree: 'Bachelor of Science in Computer Science', institution: 'University of Technology', location: '', startDate: '2020', endDate: '2024', details: [] }],
  skills: { languages: ['JavaScript', 'TypeScript', 'Python', 'SQL'], frameworks: ['React', 'Node.js'], tools: ['Git', 'REST APIs'], databases: ['Cloud Computing'], softSkills: [], other: [] },
  certifications: ['AWS Cloud Practitioner'],
  achievements: [],
  missingFields: [],
  confidenceNotes: []
}
