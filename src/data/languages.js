// Spoken and signed languages offered by the resume language picker (English names, A–Z).
const languages = [
  'Afrikaans', 'Albanian', 'American Sign Language', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani',
  'Basque', 'Belarusian', 'Bengali', 'Bhojpuri', 'Bosnian', 'British Sign Language', 'Bulgarian', 'Burmese',
  'Cantonese', 'Catalan', 'Cebuano', 'Croatian', 'Czech', 'Danish', 'Dogri', 'Dutch',
  'English', 'Estonian', 'Filipino', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati',
  'Haitian Creole', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indian Sign Language', 'Indonesian', 'Irish', 'Italian',
  'Japanese', 'Javanese', 'Kannada', 'Kashmiri', 'Kazakh', 'Khmer', 'Kinyarwanda', 'Konkani', 'Korean', 'Kurdish', 'Kyrgyz',
  'Lao', 'Latin', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Maithili', 'Malagasy', 'Malay', 'Malayalam', 'Maltese',
  'Mandarin Chinese', 'Manipuri', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia', 'Pashto', 'Persian', 'Polish',
  'Portuguese', 'Punjabi', 'Quechua', 'Romanian', 'Russian', 'Samoan', 'Sanskrit', 'Santali', 'Scottish Gaelic', 'Serbian',
  'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tagalog', 'Tajik', 'Tamil',
  'Tatar', 'Telugu', 'Thai', 'Tibetan', 'Tigrinya', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek',
  'Vietnamese', 'Welsh', 'Wolof', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu'
]

// Always presented A–Z, whatever order entries are added in above.
export const spokenLanguages = Object.freeze([...languages].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })))
