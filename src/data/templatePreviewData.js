import samplePortrait from '../assets/sample-resume-portrait.jpg'

// Representative content for the template gallery, normalized to the shape
// consumed by the resume renderer and editor.
export const templatePreviewResumeData = {
  fullName: 'John Doe',
  headline: 'Software Engineer | Full Stack Developer',
  email: 'john.doe@example.com',
  phone: '+1 415 555 0187',
  location: 'San Francisco, California',
  photo: { source: samplePortrait, width: 72, height: 72, shape: 'circle', objectFit: 'cover' },
  links: [
    { label: 'linkedin.com/in/johndoe', url: 'linkedin.com/in/johndoe' },
    { label: 'github.com/johndoe', url: 'github.com/johndoe' }
  ],
  summary: 'Computer Science graduate with experience in full-stack development, cloud technologies, and AI-powered applications. Skilled in React, Node.js, Python, PostgreSQL, Docker, and AWS, with a strong foundation in data structures, algorithms, and scalable software development.',
  education: [
    {
      institution: 'University of California, Berkeley', degree: 'Bachelor of Science in Computer Science',
      location: 'Berkeley, California', startDate: '2020', endDate: '2024',
      details: ['GPA: 3.8/4.0', 'Relevant Coursework: Data Structures, Algorithms, Databases, Operating Systems, Machine Learning']
    },
    {
      institution: 'Lincoln High School', degree: 'High School Diploma', location: 'San Francisco, California',
      startDate: '2016', endDate: '2020', details: ['GPA: 3.9/4.0']
    }
  ],
  experience: [
    {
      company: 'Google', role: 'Software Engineer', location: 'Mountain View, California',
      startDate: 'Jul 2024', endDate: 'Present', bullets: [
        'Developed scalable backend services and REST APIs for internal engineering platforms.',
        'Improved application response time by 30% through caching and database query optimization.',
        'Built React dashboards for monitoring application performance and service health.',
        'Worked with engineers, product managers, and designers in an Agile environment.'
      ]
    },
    {
      company: 'Microsoft', role: 'Software Engineering Intern', location: 'Redmond, Washington',
      startDate: 'May 2023', endDate: 'Aug 2023', bullets: [
        'Developed features for an internal cloud management platform using React and .NET.',
        'Built reusable UI components and integrated them with REST APIs.',
        'Added unit and integration tests, increasing overall test coverage.'
      ]
    }
  ],
  projects: [
    {
      name: 'DevMind AI', techStack: ['Next.js', 'FastAPI', 'PostgreSQL', 'OpenAI API'],
      description: 'AI-powered assistant that answers questions about uploaded code repositories.',
      bullets: ['Implemented semantic search and retrieval using embeddings and vector storage.', 'Created a responsive chat interface with contextual source references.']
    },
    {
      name: 'CodeCollab', techStack: ['React', 'Node.js', 'Socket.IO', 'MongoDB'],
      description: 'Real-time collaborative code editor supporting multiple users.',
      bullets: ['Implemented live code synchronization, authentication, chat, and persistent projects.']
    }
  ],
  skills: {
    languages: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'SQL'],
    frontend: ['React', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS'],
    backend: ['Node.js', 'Express.js', 'FastAPI', 'REST APIs'],
    databases: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
    tools: ['Git', 'GitHub', 'Docker', 'AWS', 'Linux', 'Postman']
  },
  certifications: ['AWS Certified Cloud Practitioner', 'Machine Learning Specialization - DeepLearning.AI'],
  achievements: ['Winner - Berkeley AI Hackathon 2023', "Dean's List - 2021, 2022 and 2023"],
  missingFields: [],
  confidenceNotes: []
}
