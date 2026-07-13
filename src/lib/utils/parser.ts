export type ParsedQuestion = {
  questionNumber: number
  questionText: string
  questionType: 'MCQ' | 'SPR'
  domainTag: 'Algebra' | 'Advanced Math' | 'Problem-Solving' | 'Geometry/Trig'
  choices?: Record<string, string> | null
  correctAnswer: string
}

export function parseBulkQuestions(rawText: string): ParsedQuestion[] {
  // Split the input into blocks, assuming double newlines separate questions
  const blocks = rawText.split(/\n\s*\n/).filter(block => block.trim().length > 0)
  
  const questions: ParsedQuestion[] = []

  blocks.forEach((block, index) => {
    // Extract tokens using regex
    const qMatch = block.match(/\[Q\]([\s\S]*?)(?=\[(?:TYPE|TAG|A|B|C|D|ANS)\]|$)/i)
    const typeMatch = block.match(/\[TYPE\]([\s\S]*?)(?=\[(?:Q|TAG|A|B|C|D|ANS)\]|$)/i)
    const tagMatch = block.match(/\[TAG\]([\s\S]*?)(?=\[(?:Q|TYPE|A|B|C|D|ANS)\]|$)/i)
    const ansMatch = block.match(/\[ANS\]([\s\S]*?)(?=\[(?:Q|TYPE|TAG|A|B|C|D)\]|$)/i)
    
    const aMatch = block.match(/\[A\]([\s\S]*?)(?=\[(?:Q|TYPE|TAG|B|C|D|ANS)\]|$)/i)
    const bMatch = block.match(/\[B\]([\s\S]*?)(?=\[(?:Q|TYPE|TAG|A|C|D|ANS)\]|$)/i)
    const cMatch = block.match(/\[C\]([\s\S]*?)(?=\[(?:Q|TYPE|TAG|A|B|D|ANS)\]|$)/i)
    const dMatch = block.match(/\[D\]([\s\S]*?)(?=\[(?:Q|TYPE|TAG|A|B|C|ANS)\]|$)/i)

    const questionText = qMatch ? qMatch[1].trim() : ''
    const rawType = typeMatch ? typeMatch[1].trim().toUpperCase() : 'MCQ'
    const rawTag = tagMatch ? tagMatch[1].trim() : 'Algebra'
    const correctAnswer = ansMatch ? ansMatch[1].trim() : ''

    const questionType: 'MCQ' | 'SPR' = (rawType === 'SPR') ? 'SPR' : 'MCQ'
    
    // Naive tag matching
    let domainTag: 'Algebra' | 'Advanced Math' | 'Problem-Solving' | 'Geometry/Trig' = 'Algebra'
    if (rawTag.toLowerCase().includes('advanced')) domainTag = 'Advanced Math'
    else if (rawTag.toLowerCase().includes('problem') || rawTag.toLowerCase().includes('data')) domainTag = 'Problem-Solving'
    else if (rawTag.toLowerCase().includes('geo') || rawTag.toLowerCase().includes('trig')) domainTag = 'Geometry/Trig'

    let choices: Record<string, string> | null = null
    if (questionType === 'MCQ') {
      choices = {
        A: aMatch ? aMatch[1].trim() : '',
        B: bMatch ? bMatch[1].trim() : '',
        C: cMatch ? cMatch[1].trim() : '',
        D: dMatch ? dMatch[1].trim() : '',
      }
    }

    questions.push({
      questionNumber: index + 1,
      questionText,
      questionType,
      domainTag,
      choices,
      correctAnswer,
    })
  })

  // Ensure we always return exactly 27 slots if we are parsing less. 
  // If parsing more, slice to 27.
  const paddedQuestions = [...questions].slice(0, 27)
  while (paddedQuestions.length < 27) {
    paddedQuestions.push({
      questionNumber: paddedQuestions.length + 1,
      questionText: '',
      questionType: 'MCQ',
      domainTag: 'Algebra',
      choices: { A: '', B: '', C: '', D: '' },
      correctAnswer: ''
    })
  }

  return paddedQuestions
}
