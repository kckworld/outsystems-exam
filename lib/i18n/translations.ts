export const translations = {
  ko: {
    // Navigation
    home: '홈',
    practice: '연습',
    train: '맞춤 학습',
    mistakes: '오답노트',
    stats: '통계',
    admin: '관리자',

    // Home page
    homeTitle: 'OutSystems 자격증 연습 도구',
    homeDescription: '효과적인 학습으로 자격증 시험을 준비하세요',
    practiceCard: {
      title: '연습',
      description: '전체 문제 세트로 연습하세요'
    },
    trainCard: {
      title: '맞춤 학습',
      description: '특정 주제와 난이도를 선택하세요'
    },
    mistakesCard: {
      title: '오답노트',
      description: '틀린 문제를 복습하세요'
    },
    statsCard: {
      title: '성적 통계',
      description: '약점을 파악하고 진행 상황을 추적하세요'
    },
    gettingStarted: '시작하기',
    gettingStartedSteps: [
      '관리자 페이지에서 문제 세트를 가져오세요',
      '연습을 시작하여 전체 시험을 치르세요',
      '통계를 확인하여 약한 주제를 파악하세요',
      '맞춤 학습으로 약한 부분을 집중 연습하세요',
      '오답노트로 틀린 문제를 복습하세요'
    ],
    tipTitle: '💡 팁',
    tipDescription: '연습 후 통계를 확인하여 추천 학습 주제를 확인하세요.',

    // Practice page
    practiceTitle: '문제 세트 선택',
    practiceDescription: '연습할 문제 세트를 선택하세요',
    searchPlaceholder: '문제 세트 검색...',
    loading: '로딩 중...',
    noSetsFound: '문제 세트를 찾을 수 없습니다',
    questions: '문제',
    startPractice: '연습 시작',

    // Question card
    submit: '답안 제출',
    next: '다음 문제',
    correct: '정답',
    wrong: '오답',
    explanation: '설명',
    keyboardHint: '1-4를 눌러 답 선택',

    // Results
    practiceComplete: '연습 완료',
    score: '점수',
    passed: '70% 이상! 잘하셨습니다.',
    failed: '70%에 도달하려면 더 연습하세요',
    backToSets: '문제 세트로 돌아가기',
    practiceAgain: '다시 연습',
    restart: '재시작',
    restartConfirm: '정말 재시작하시겠습니까? 진행 상황이 손실됩니다.',
    previous: '이전',
    finish: '완료',

    // Admin page
    adminTitle: '관리자 대시보드',
    adminDescription: '문제 세트를 가져오고 관리하세요',
    importSet: '문제 세트 가져오기',
    questionSets: '문제 세트',
    clone: '복제',
    export: '내보내기',
    delete: '삭제',
    locked: '잠김',
    created: '생성일',
    deleteConfirm: '이 문제 세트를 삭제하시겠습니까?',

    // Import form
    importTitle: '문제 세트 가져오기',
    pasteJson: 'JSON 데이터를 붙여넣으세요',
    importButton: '가져오기',
    importing: '가져오는 중...',
    importSuccess: '가져오기 성공',
    importError: '가져오기 실패',

    // Train page
    trainTitle: '맞춤 학습',
    trainDescription: '주제와 난이도를 선택하여 맞춤 연습 세션을 만드세요',
    comingSoon: '곧 출시 예정',
    topics: '주제',
    selectTopics: '주제 선택 (곧 출시)',
    difficulty: '난이도',
    selectDifficulty: '난이도로 필터링 (곧 출시)',
    questionCount: '문제 수',
    createSession: '학습 세션 생성',

    // Stats page
    statsTitle: '성적 통계',
    statsDescription: '성과를 분석하고 약한 부분을 파악하세요',
    overallPerformance: '전체 성적',
    topicBreakdown: '주제별 분석',
    weakAreas: '약한 영역',
    noData: '데이터 없음',

    // Common
    cancel: '취소',
    close: '닫기',
    save: '저장',
    edit: '편집',
    confirm: '확인',
    
    // Difficulty
    easy: '쉬움',
    medium: '보통',
    hard: '어려움'
  },
  en: {
    // Navigation
    home: 'Home',
    practice: 'Practice',
    train: 'Train',
    mistakes: 'Mistakes',
    stats: 'Stats',
    admin: 'Admin',

    // Home page
    homeTitle: 'OutSystems Certification Practice',
    homeDescription: 'Prepare for your certification exam with effective practice',
    practiceCard: {
      title: 'Practice',
      description: 'Practice with complete question sets'
    },
    trainCard: {
      title: 'Custom Training',
      description: 'Focus on specific topics and difficulty levels'
    },
    mistakesCard: {
      title: 'Mistake Notebook',
      description: 'Review questions you got wrong'
    },
    statsCard: {
      title: 'Performance Stats',
      description: 'Identify weak areas and track progress'
    },
    gettingStarted: 'Getting Started',
    gettingStartedSteps: [
      'Import question sets via Admin page',
      'Start with Practice to take full exams',
      'Check Stats to identify weak topics',
      'Use Custom Training to focus on weak areas',
      'Review mistakes in the Mistake Notebook'
    ],
    tipTitle: '💡 Tip',
    tipDescription: 'After practice sessions, check Stats to see recommended training topics.',

    // Practice page
    practiceTitle: 'Select a Question Set',
    practiceDescription: 'Choose a question set to start practicing',
    searchPlaceholder: 'Search question sets...',
    loading: 'Loading...',
    noSetsFound: 'No question sets found',
    questions: 'questions',
    startPractice: 'Start Practice',

    // Question card
    submit: 'Submit Answer',
    next: 'Next Question',
    correct: 'Correct',
    wrong: 'Wrong',
    explanation: 'Explanation',
    keyboardHint: 'Press 1-4 to select an answer',

    // Results
    practiceComplete: 'Practice Complete',
    score: 'Score',
    passed: 'Great job! You passed the 70% threshold.',
    failed: 'Keep practicing to reach 70%',
    backToSets: 'Back to Sets',
    practiceAgain: 'Practice Again',
    restart: 'Restart',
    restartConfirm: 'Are you sure you want to restart? Your progress will be lost.',
    previous: 'Previous',
    finish: 'Finish',

    // Admin page
    adminTitle: 'Admin Dashboard',
    adminDescription: 'Import and manage question sets',
    importSet: 'Import Question Set',
    questionSets: 'Question Sets',
    clone: 'Clone',
    export: 'Export',
    delete: 'Delete',
    locked: 'Locked',
    created: 'Created',
    deleteConfirm: 'Are you sure you want to delete this question set?',

    // Import form
    importTitle: 'Import Question Set',
    pasteJson: 'Paste JSON data here',
    importButton: 'Import',
    importing: 'Importing...',
    importSuccess: 'Import successful',
    importError: 'Import failed',

    // Train page
    trainTitle: 'Custom Training',
    trainDescription: 'Create custom practice sessions by selecting topics and difficulty levels',
    comingSoon: 'Coming Soon',
    topics: 'Topics',
    selectTopics: 'Select topics (coming soon)',
    difficulty: 'Difficulty',
    selectDifficulty: 'Filter by difficulty (coming soon)',
    questionCount: 'Question Count',
    createSession: 'Create Training Session',

    // Stats page
    statsTitle: 'Performance Statistics',
    statsDescription: 'Analyze your performance and identify weak areas',
    overallPerformance: 'Overall Performance',
    topicBreakdown: 'Topic Breakdown',
    weakAreas: 'Weak Areas',
    noData: 'No data available',

    // Common
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    edit: 'Edit',
    confirm: 'Confirm',
    
    // Difficulty
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.ko;
