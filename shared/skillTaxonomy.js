// Maps GitHub languages and project-manifest packages to resume skill names.
import { knownSkillsIn } from './roleAnalysis.js'

// Languages GitHub reports that are markup, styling, config or notebooks rather than programming.
export const MARKUP_LANGUAGES = new Set(['HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Stylus', 'Dockerfile', 'Makefile', 'CMake', 'Procfile', 'Batchfile', 'PowerShell', 'Jupyter Notebook', 'TeX', 'Markdown', 'Roff', 'Mustache', 'Handlebars', 'EJS', 'Pug', 'Twig', 'Smarty', 'Nix', 'HCL'])

// Resume wording → GitHub language name.
const languageAliases = {
  js: 'JavaScript', javascript: 'JavaScript', 'node.js': 'JavaScript', nodejs: 'JavaScript', node: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript', py: 'Python', python: 'Python', java: 'Java', 'c#': 'C#', csharp: 'C#',
  'c++': 'C++', cpp: 'C++', c: 'C', go: 'Go', golang: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', kotlin: 'Kotlin',
  swift: 'Swift', dart: 'Dart', scala: 'Scala', r: 'R', matlab: 'MATLAB', 'objective-c': 'Objective-C', perl: 'Perl',
  lua: 'Lua', haskell: 'Haskell', elixir: 'Elixir', clojure: 'Clojure', 'f#': 'F#', julia: 'Julia', solidity: 'Solidity',
  html: 'HTML', html5: 'HTML', css: 'CSS', css3: 'CSS', scss: 'SCSS', sass: 'Sass', shell: 'Shell', bash: 'Shell',
  sql: 'PLpgSQL', 'jupyter': 'Jupyter Notebook', vue: 'Vue', 'vue.js': 'Vue', svelte: 'Svelte', powershell: 'PowerShell'
}

// Manifest package names → skill. Matched exactly against dependency names.
export const PACKAGE_SKILLS = {
  react: 'React', 'react-dom': 'React', next: 'Next.js', vue: 'Vue.js', nuxt: 'Nuxt', '@angular/core': 'Angular', svelte: 'Svelte',
  express: 'Express.js', fastify: 'Fastify', '@nestjs/core': 'NestJS', koa: 'Koa', 'socket.io': 'Socket.IO',
  tailwindcss: 'Tailwind CSS', bootstrap: 'Bootstrap', '@mui/material': 'Material UI', 'styled-components': 'styled-components', sass: 'Sass',
  redux: 'Redux', '@reduxjs/toolkit': 'Redux', zustand: 'Zustand', 'react-query': 'React Query', '@tanstack/react-query': 'React Query',
  graphql: 'GraphQL', '@apollo/client': 'GraphQL', 'apollo-server': 'GraphQL', jest: 'Jest', vitest: 'Vitest', cypress: 'Cypress',
  '@playwright/test': 'Playwright', playwright: 'Playwright', mocha: 'Mocha', 'react-native': 'React Native', electron: 'Electron', expo: 'Expo',
  mongoose: 'MongoDB', mongodb: 'MongoDB', pg: 'PostgreSQL', postgres: 'PostgreSQL', mysql: 'MySQL', mysql2: 'MySQL', sqlite3: 'SQLite',
  redis: 'Redis', ioredis: 'Redis', prisma: 'Prisma', '@prisma/client': 'Prisma', sequelize: 'Sequelize', typeorm: 'TypeORM', firebase: 'Firebase',
  'firebase-admin': 'Firebase', '@supabase/supabase-js': 'Supabase', 'aws-sdk': 'AWS', '@aws-sdk/client-s3': 'AWS', three: 'Three.js', d3: 'D3.js',
  'chart.js': 'Chart.js', vite: 'Vite', webpack: 'Webpack', typescript: 'TypeScript', openai: 'OpenAI API', '@anthropic-ai/sdk': 'Anthropic API', 'groq-sdk': 'Groq API',
  // Python
  django: 'Django', flask: 'Flask', fastapi: 'FastAPI', pandas: 'Pandas', numpy: 'NumPy', 'scikit-learn': 'scikit-learn', sklearn: 'scikit-learn',
  tensorflow: 'TensorFlow', torch: 'PyTorch', pytorch: 'PyTorch', keras: 'Keras', matplotlib: 'Matplotlib', seaborn: 'Seaborn', sqlalchemy: 'SQLAlchemy',
  pytest: 'pytest', 'psycopg2': 'PostgreSQL', 'psycopg2-binary': 'PostgreSQL', pymongo: 'MongoDB', celery: 'Celery', streamlit: 'Streamlit',
  transformers: 'Hugging Face Transformers', langchain: 'LangChain', opencv: 'OpenCV', 'opencv-python': 'OpenCV', scrapy: 'Scrapy', beautifulsoup4: 'BeautifulSoup',
  boto3: 'AWS', 'google-cloud-storage': 'Google Cloud', jupyter: 'Jupyter',
  // Go / Rust / Java markers handled by name below
  'github.com/gin-gonic/gin': 'Gin', 'github.com/gofiber/fiber': 'Fiber', 'gorm.io/gorm': 'GORM', tokio: 'Tokio', actix: 'Actix', 'actix-web': 'Actix', serde: 'Serde'
}

/** Normalised skill key, so "JS", "javascript" and "JavaScript" compare equal. */
export function skillKey(name) {
  const value = String(name ?? '').trim()
  const lower = value.toLowerCase()
  if (languageAliases[lower]) return languageAliases[lower].toLowerCase()
  const known = knownSkillsIn(value)[0]
  return (known ?? value).toLowerCase().replace(/\.js$/, '').replace(/\s+/g, ' ')
}

/** GitHub language name a resume skill refers to, if any. */
export function languageForSkill(name) {
  const lower = String(name ?? '').trim().toLowerCase()
  return languageAliases[lower] ?? null
}

/** Skills found in a manifest file's text. */
export function skillsFromManifest(path, text) {
  const found = new Set()
  const source = String(text ?? '')
  const file = String(path).toLowerCase()
  if (file.endsWith('package.json')) {
    try {
      const json = JSON.parse(source)
      Object.keys({ ...json.dependencies, ...json.devDependencies, ...json.peerDependencies }).forEach(name => { if (PACKAGE_SKILLS[name]) found.add(PACKAGE_SKILLS[name]) })
      found.add('Node.js')
    } catch { /* malformed package.json: skip */ }
  } else if (/requirements\.txt$|pyproject\.toml$|pipfile$/.test(file)) {
    source.split(/\r?\n/).forEach(line => {
      const name = line.trim().toLowerCase().replace(/^["']|["',]$/g, '').split(/[<>=~!\[;\s"']/)[0]
      if (PACKAGE_SKILLS[name]) found.add(PACKAGE_SKILLS[name])
    })
  } else if (file.endsWith('go.mod')) {
    Object.entries(PACKAGE_SKILLS).forEach(([name, skill]) => { if (name.includes('/') && source.includes(name)) found.add(skill) })
  } else if (file.endsWith('cargo.toml')) {
    ['tokio', 'actix-web', 'actix', 'serde'].forEach(name => { if (new RegExp(`^${name}\\s*=`, 'm').test(source)) found.add(PACKAGE_SKILLS[name]) })
  } else if (/pom\.xml$|build\.gradle(\.kts)?$/.test(file)) {
    if (/spring-boot/.test(source)) found.add('Spring Boot')
    if (/hibernate/.test(source)) found.add('Hibernate')
    if (/junit/.test(source)) found.add('JUnit')
    if (/postgresql/.test(source)) found.add('PostgreSQL')
    if (/mysql/.test(source)) found.add('MySQL')
  } else if (/dockerfile$/.test(file)) {
    found.add('Docker')
  } else if (/docker-compose\.ya?ml$/.test(file)) {
    found.add('Docker')
    if (/postgres/i.test(source)) found.add('PostgreSQL')
    if (/redis/i.test(source)) found.add('Redis')
    if (/mongo/i.test(source)) found.add('MongoDB')
  } else if (/\.github\/workflows\//.test(file)) {
    found.add('GitHub Actions')
    found.add('CI/CD')
  }
  return [...found]
}
