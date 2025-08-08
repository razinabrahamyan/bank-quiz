import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selectedSection, setSelectedSection] = useState('all');

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setDebugInfo('Loading questions from JSON file...');

      const response = await fetch('/questions.json');
      if (!response.ok) {
        throw new Error(`Failed to load questions.json: ${response.status}`);
      }

      const questionsData = await response.json();
      console.log(`Loaded ${questionsData.length} questions from JSON file`);
      setDebugInfo(`Loaded ${questionsData.length} questions from JSON file`);

      setQuestions(questionsData);
      setLoading(false);
      // Don't set current question here, let the useEffect handle it
    } catch (error) {
      console.error('Error loading questions:', error);
      setDebugInfo(`Error loading questions: ${error.message}. Please run 'python process_excel.py' first.`);
      setLoading(false);
    }
  }, []);

  // Load answered questions from localStorage on component mount
  useEffect(() => {
    const savedAnswered = localStorage.getItem('answeredQuestions');
    const savedCorrect = localStorage.getItem('correctAnswers');
    const savedTotal = localStorage.getItem('totalAnswered');

    if (savedAnswered) {
      setAnsweredQuestions(new Set(JSON.parse(savedAnswered)));
    }
    if (savedCorrect) {
      setCorrectAnswers(parseInt(savedCorrect));
    }
    if (savedTotal) {
      setTotalAnswered(parseInt(savedTotal));
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Load a question when questions are loaded or section changes
  useEffect(() => {
    if (questions.length > 0 && !currentQuestion) {
      loadNewQuestion();
    }
  }, [questions, selectedSection, currentQuestion]);

  const handleAnswerClick = (answerIndex) => {
    if (showResult) return; // Prevent multiple clicks

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);
    setShowResult(true);

    // Update statistics and localStorage
    const newTotalAnswered = totalAnswered + 1;
    const newCorrectAnswers = correctAnswers + (correct ? 1 : 0);
    const newAnsweredQuestions = new Set([...answeredQuestions, currentQuestion.id]);

    setTotalAnswered(newTotalAnswered);
    setCorrectAnswers(newCorrectAnswers);
    setAnsweredQuestions(newAnsweredQuestions);

    // Save to localStorage
    localStorage.setItem('answeredQuestions', JSON.stringify([...newAnsweredQuestions]));
    localStorage.setItem('correctAnswers', newCorrectAnswers.toString());
    localStorage.setItem('totalAnswered', newTotalAnswered.toString());
    localStorage.setItem(`question_${currentQuestion.id}_correct`, correct.toString());
  };

  const getFilteredQuestions = () => {
    if (selectedSection === 'all') {
      return questions;
    }
    return questions.filter(q => q.sourceFile.startsWith(selectedSection));
  };

  const getSectionStats = () => {
    const filteredQuestions = getFilteredQuestions();
    const answeredInSection = [...answeredQuestions].filter(id => {
      const question = questions.find(q => q.id === id);
      return question && (selectedSection === 'all' || question.sourceFile.startsWith(selectedSection));
    });
    
    const correctInSection = answeredInSection.filter(id => {
      const question = questions.find(q => q.id === id);
      return question && localStorage.getItem(`question_${id}_correct`) === 'true';
    });
    
    return {
      total: answeredInSection.length,
      correct: correctInSection.length
    };
  };

  const loadNewQuestion = (section = selectedSection) => {
    if (questions.length === 0) return;

    // Get filtered questions based on the provided section
    const filteredQuestions = section === 'all' 
      ? questions 
      : questions.filter(q => q.sourceFile.startsWith(section));
    
    // Filter out already answered questions
    const unansweredQuestions = filteredQuestions.filter(q => !answeredQuestions.has(q.id));

    if (unansweredQuestions.length === 0) {
      // All questions answered for this section, show completion message
      setCurrentQuestion(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    setCurrentQuestion(unansweredQuestions[randomIndex]);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const resetProgress = () => {
    setAnsweredQuestions(new Set());
    setCorrectAnswers(0);
    setTotalAnswered(0);
    
    // Clear all localStorage data
    localStorage.removeItem('answeredQuestions');
    localStorage.removeItem('correctAnswers');
    localStorage.removeItem('totalAnswered');
    
    // Clear question-specific localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('question_')) {
        localStorage.removeItem(key);
      }
    }
    
    loadNewQuestion();
  };

  const handleSectionChange = (event) => {
    const newSection = event.target.value;
    setSelectedSection(newSection);
    // Reset current question when section changes
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    // Load a new question for the selected section immediately
    loadNewQuestion(newSection);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading questions...</h2>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            {debugInfo}
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="App">
        <div className="error">
          <h2>No questions found</h2>
          <p>Please run the Python script to process Excel files first:</p>
          <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            <strong>Steps:</strong>
            <ol style={{ textAlign: 'left', marginTop: '10px' }}>
              <li>Install Python dependencies: <code>pip install -r requirements.txt</code></li>
              <li>Run the processor: <code>python process_excel.py</code></li>
              <li>Refresh this page</li>
            </ol>
            <strong>Debug Info:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {debugInfo}
            </pre>
          </div>
          <button onClick={loadQuestions} className="reload-button">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="quiz-header">
        <div className="score-display">
          {(() => {
            const stats = getSectionStats();
            return (
              <>
                <span className="score-number">{stats.correct}</span> / {stats.total}
              </>
            );
          })()}
        </div>
        <div className='section-selector'>
          <select 
            value={selectedSection} 
            onChange={handleSectionChange}
            className="section-select"
          >
            <option value="all">All Sections</option>
            <option value="1">Section 1</option>
            <option value="2">Section 2</option>
            <option value="3">Section 3</option>
            <option value="4">Section 4</option>
            <option value="5">Section 5</option>
            <option value="6">Section 6</option>
          </select>
        </div> 
        <button className="reset-button" onClick={resetProgress}>
          Reset
        </button>
      </div>
      <div className="quiz-container">
        {/* Header with score and reset button */}


        {currentQuestion && (
          <div className="question-section">
            <div className="question-header">
              <div className="question-group">{currentQuestion.questionGroup}</div>
              <div className="source-file">Source: {currentQuestion.sourceFile}</div>
            </div>
            <h2 className="question">{currentQuestion.question}</h2>

            <div className="answers">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  className={`answer-button ${selectedAnswer === index
                      ? showResult
                        ? isCorrect
                          ? 'correct'
                          : 'incorrect'
                        : 'selected'
                      : showResult && index === currentQuestion.correctAnswerIndex
                        ? 'correct'
                        : ''
                    }`}
                  onClick={() => handleAnswerClick(index)}
                  disabled={showResult}
                >
                  {answer}
                </button>
              ))}
            </div>



            <button className="reload-button" onClick={loadNewQuestion}>
              Next Question
            </button>
          </div>
        )}

        {/* Show completion message when all questions are answered */}
        {!currentQuestion && questions.length > 0 && (
          <div className="completion-message">
            <h2>🎉 Congratulations!</h2>
            <p>
              {selectedSection === 'all' 
                ? `You have completed all ${questions.length} questions!`
                : `You have completed all questions in Section ${selectedSection}!`
              }
            </p>
            <p>Final Score: {correctAnswers} / {totalAnswered} Correct</p>
            <button className="reset-button" onClick={resetProgress}>
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
