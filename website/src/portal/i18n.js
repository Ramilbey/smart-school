// Words for the teacher portal and the student page. English only.
import { fmt } from './ui.js';

export const T = {
  en: {
    brand: 'Smart Schools', portal: 'Teacher portal', overview: 'Overview', viewEditor: 'Quiz editor', viewHost: 'Live game', viewResults: 'Results', teacherLabel: 'Teacher', backToSite: 'Back to the site', studentArea: 'Student area', logout: 'Log out', loading: 'Loading…',
    serverDown: 'Cannot reach the Smart Schools server.',
    serverDownHelp: 'The portal needs the server to be running. In the smart-schools-app folder run “npm run dev”, then reload. This page looks for it at {api}.',
    retry: 'Try again',
    // login
    loginTitle: 'Teacher login', registerTitle: 'Create a teacher account', username: 'Username', password: 'Password', yourName: 'Your name',
    loginBtn: 'Log in', registerBtn: 'Create account', haveAccount: 'I already have an account', needAccount: 'Create a new account',
    demoHint: 'Just looking around?', demoBtn: 'Use the demo teacher', signupOff: 'New accounts are switched off on this server.',
    passwordHint: '6 or more characters', usernameHint: 'Letters, digits, dots, dashes. Example: dilnoza.7b',
    // home
    hello: 'Hello, {name}', myQuizzes: 'My quizzes', noQuizzes: 'No quizzes yet. Make your first one in a minute.',
    newQuiz: 'New quiz', fromTopic: 'From a textbook topic', fromAi: 'Draft with AI', questionsN: '{n} questions', play: 'Play', edit: 'Edit', del: 'Delete',
    confirmDel: 'Delete “{title}”? This cannot be undone.', activeGames: 'Games running now', resume: 'Open', recent: 'Recent results', noResults: 'No finished games yet.',
    playersN: '{n} students', open: 'Open', sourceHand: 'By hand', sourceTextbook: 'Textbook', sourceAi: 'AI draft', untitled: 'New quiz',
    // editor
    quizTitle: 'Quiz title', subject: 'Subject (optional)', questionN: 'Question {n}', questionText: 'Question',
    answerChoices: 'Answers. Pick the right one.', addChoice: 'Add an answer', removeChoice: 'Remove', kindChoice: 'Choose an answer', kindNumber: 'Type a number',
    numberAnswer: 'Right answer (a number)', explanation: 'Why is it right? (optional)', addQuestion: 'Add a question', save: 'Save', saved: 'Saved', unsaved: 'Not saved yet',
    back: 'Back', moveUp: 'Up', moveDown: 'Down', deleteQuestion: 'Delete', textbookPicture: 'Picture from the textbook', removePicture: 'Remove the picture',
    topicTitle: 'Questions from a textbook topic', topicPick: 'Topic', topicCount: 'How many questions', makeQuestions: 'Make questions',
    topicFewer: 'This topic has only {n} different questions, so you got {n}.', topicBook: 'Following the school textbook',
    aiTitle: 'Draft with AI', aiTopic: 'What should the questions be about?', aiTopicHint: 'For example: adding fractions with different denominators', aiGrade: 'Grade',
    aiNote: 'The AI writes a draft. Read every question and fix it before you play.', aiMaking: 'The AI is writing…', aiOff: 'AI drafts are switched off on this server (no API key).',
    cancel: 'Cancel', addToQuiz: 'Add to the quiz', needQuestion: 'Add at least one question first.', someAdded: '{n} questions added. Read them, then save.',
    gradeN: 'Grade {n}',
    // launch
    startGame: 'Start a game', gameMode: 'Game', battle: 'Quiz Battle', battleDesc: 'You move through the questions. Faster right answers score more.',
    speed: 'Speed Round', speedDesc: 'Everyone answers at their own pace. Most right answers wins.', secondsPer: 'Seconds per question', roundSeconds: 'Round length (seconds)',
    teamsLabel: 'Teams', noTeams: 'No teams', teamsN: '{n} teams', create: 'Create the game', saveFirst: 'Saving the quiz first…',
    // host
    joinAt: 'Students open', joinCode: 'and type the code', joinBase: 'Address students use',
    joinBaseHelp: 'Phones cannot open “localhost”. Use your computer’s network address, for example http://192.168.1.20:5190',
    waiting: 'Waiting for students…', studentsN: '{n} students joined', start: 'Start', endGame: 'End game', kick: 'Remove', reveal: 'Show the answer', next: 'Next question',
    finish: 'Finish', answeredN: '{a} of {n} answered', question: 'Question {i} of {n}', rightAnswer: 'Right answer', leaderboard: 'Leaderboard', teamsBoard: 'Teams',
    team: 'Team {n}', finalTitle: 'Game over', winner: 'Winner', accuracy: 'Right answers per question', percentRight: '{p}% right', backHome: 'Back to my quizzes',
    points: '{n} pts', waitStart: 'Share the code. Press Start when everyone is in.', speedRunning: 'Round in progress', timeLeft: 'Time left', online: 'here', away: 'away',
    endConfirm: 'End the game now?', rightN: '{n} right', resultsTitle: 'Results', student: 'Student', score: 'Score', rightCol: 'Right',
    // student
    joinTitle: 'Join a game', gameCode: 'Game code', yourFirstName: 'Your first name', pickTeam: 'Pick your team', joinBtn: 'Join',
    youAreIn: 'You are in!', waitNext: 'Look at the big screen. The next question is coming.', waitTeacher: 'Look at the big screen. The teacher will start the game.', alsoHere: 'Also here', questionOf: 'Question {i} of {n}',
    typeNumber: 'Type your answer', send: 'Send', locked: 'Answer sent. Waiting for the others…', right: 'Right!', wrong: 'Not this time', timeUp: 'Time is up',
    rightWas: 'The right answer was {a}', plusPts: '+{n} points', yourRank: 'Place {r} of {n}', finalScore: 'Your score', gameOver: 'Game over', rightAnswers: 'Right answers',
    speedDone: 'You answered everything. Waiting for the clock…', noGame: 'No game with this code.', leave: 'Leave', serverDownP: 'Cannot reach the game server.',
    yourTeam: 'Your team: {n}', timeLeftShort: '{s}s',
    // ready-made games
    gamesTitle: 'Ready-made games', gamesHelp: 'Pick a game, then change the questions, words or numbers to fit your lesson.',
    useGame: 'Play this', makeGame: 'Set it up', pickQuiz: 'Which quiz?', noQuizForGame: 'You have no quiz yet. Make one first, or set up Math Sprint, True or False Blitz or Word Typer.',
    survivor: 'Last One Standing', survivorDesc: 'A wrong answer puts you out. The last student in wins.',
    race: 'Team Race', raceDesc: 'Teams race along a track. Every right answer moves the team forward.',
    tf: 'True or False Blitz', tfDesc: 'Write statements. Students decide fast: true or false?',
    math: 'Math Sprint', mathDesc: 'Pick the kinds of sums and the numbers. Every student gets the sums in their own order.',
    words: 'Word Typer', wordsDesc: 'Students type the answer: vocabulary, spelling, terms.',
    tagAny: 'Any subject', tagMath: 'Math', tagLang: 'Languages', tagTeams: 'Teams', tagTyping: 'Typing',
    gameName: 'Name of the game', tfHelp: 'One statement per line. End the line with = true or = false.',
    tfExample: 'The sun is a star = true\nA triangle has four sides = false\n7 × 8 = 54 = false',
    wordsHelp: 'One per line: the question, then =, then the answer. Other spellings that are also right go after a | sign.',
    wordsExample: 'Opposite of hot = cold\nCapital of France = Paris\nPlural of mouse = mice | mouses',
    mathHelp: 'Choose the kinds of sums and the numbers. The questions are made for you, and you can edit them next.',
    opAdd: 'Add', opSub: 'Subtract', opMul: 'Multiply', opDiv: 'Divide', opSq: 'Squares', opMissing: 'Missing number', smallest: 'Smallest number', largest: 'Largest number',
    lineError: 'Line {n}: {why}', lineNeedTF: 'end the line with = true or = false', lineNeedEq: 'write the question, then =, then the answer', lineTooLong: 'this line is too long',
    needLinesTpl: 'Write at least one line.', needOp: 'Pick at least one kind of sum.', tplMade: '{n} questions made. Look them over, change what you like, then press Play.',
    kindText: 'Type a word', textAnswer: 'Right answer (a word)', alsoAccept: 'Other spellings that are also right (separate with commas)', sourceTemplate: 'Ready-made game',
    teamsRace: 'Teams (at least 2)',
    aliveN: '{n} still in', outThisRound: 'Out this round: {names}', mercyNote: 'Everyone missed it, so nobody is out.', stillInLabel: 'Still in', outLabel: 'Out', raceTitle: 'The race',
    youAreOut: 'You are out', outAtQ: 'You lasted until question {n}.', stillIn: '{n} still in', watchWinner: 'Watch the big screen to see who wins.', lastOneYou: 'You are the last one standing!',
    // reading supports on the student's phone
    supports: 'Reading help', readAloud: 'Read the question aloud', autoRead: 'Read every question aloud', textSize: 'Text size', sizeN: 'Normal', sizeL: 'Large', sizeXL: 'Extra large', easyFont: 'Easy-read letters', stopReading: 'Stop reading',
    // the AI assistant and class insights
    askAi: 'Ask AI', askAiLead: 'Ask about your class, or tell it what to create.', askPlaceholder: 'Who is struggling? Make 6 questions about matrices…', askSend: 'Send',
    askPrivacy: 'Student names are swapped for codes before anything is sent to the AI. It can make mistakes: read what it writes.',
    askThinking: 'Thinking…', askIntroTitle: 'What can I help with?', askIntroText: 'I look at the results of your finished games, and I can write questions and start a game for you.',
    sugg1: 'Who is struggling?', sugg2: 'Which questions were hardest?', sugg3: 'Who is getting worse?', sugg4: 'Make 6 questions about fractions',
    sugg5: 'Make a gamified quiz about matrices and play it as a race', sugg6: 'Show my recent games',
    needsAttention: 'Needs attention', hardestTitle: 'Hardest questions', lastGames: 'Recent games', insightsEmpty: 'Run a game with your class and the results will show up here.',
    noOneStands: 'Nobody stands out yet.', sampleData: 'Includes sample data', sampleTag: 'Sample', sampleNote: 'Rows marked Sample are made-up demo data so you can try the assistant. Your real games are shown without the mark.',
    answeredN: '{a} answers in {g} games', trendUp: 'getting better', trendDown: 'getting worse', missedLabel: 'Missed', correctPct: '{p}% right', resultsBtn: 'Results', playersCount: '{n} students',
    openInEditor: 'Open in the editor', playAsLabel: 'Play as', styleLabel: 'Style', styleStandard: 'Standard', styleGamified: 'Gamified', typesLabel: 'Question types',
    typeChoice: 'Multiple choice', typeTf: 'True or false', typeNumber: 'Number', typeText: 'Short word', kindNumber2: 'number', kindText2: 'word', kindChoice2: 'choice', moreQuestions: '+{n} more questions',
    aiTopicLong: 'Describe the topic, or paste a text to make questions from', aiTopicLongHint: 'For example: matrices, grade 9. Or paste a paragraph from the textbook.',
    mercyStudent: 'Everyone missed it, so nobody is out.', typeWord: 'Type your answer', teamRace: 'Team race',
  },
};

export const tr = (key, vars) => fmt(T.en[key] ?? key, vars);
