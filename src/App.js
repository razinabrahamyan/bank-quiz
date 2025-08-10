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
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testResults, setTestResults] = useState(null);
  const [testQuestionsCount, setTestQuestionsCount] = useState(5); // Configurable test questions count
  const [userAnswers, setUserAnswers] = useState({}); // Track user answers in test mode
  const [showWrongAnswers, setShowWrongAnswers] = useState(false); // Toggle to show wrong answers

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
  }, [questions, selectedSection, currentQuestion, testMode]);

  // Initialize test mode questions when test mode is enabled
  useEffect(() => {
    if (testMode && questions.length > 0) {
      initializeTestMode();
    }
  }, [testMode, questions, testQuestionsCount]);

  const initializeTestMode = () => {
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    const selectedTestQuestions = shuffledQuestions.slice(0, Math.min(testQuestionsCount, questions.length));
    setTestQuestions(selectedTestQuestions);
    setCurrentQuestionIndex(0);
    setTestResults(null);
    setAnsweredQuestions(new Set());
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswers({});
    setShowWrongAnswers(false);

    if (selectedTestQuestions.length > 0) {
      setCurrentQuestion(selectedTestQuestions[0]);
    }
  };

  const handleAnswerClick = (answerIndex) => {
    if (testMode) {
      // In test mode, allow changing answers before proceeding
      setSelectedAnswer(answerIndex);
      const correct = answerIndex === currentQuestion.correctAnswerIndex;
      setIsCorrect(correct);
      setShowResult(false); // Don't show result immediately in test mode

      // Track user answer for this question
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answerIndex
      }));

      // Update the answer for the current question
      const newAnsweredQuestions = new Set([...answeredQuestions]);
      newAnsweredQuestions.add(currentQuestion.id);
      setAnsweredQuestions(newAnsweredQuestions);

      // Update correct answers count (remove previous answer if exists)
      let newCorrectAnswers = correctAnswers;
      const previousAnswer = selectedAnswer;
      if (previousAnswer !== null) {
        // Remove previous answer from count
        const wasPreviousCorrect = previousAnswer === currentQuestion.correctAnswerIndex;
        if (wasPreviousCorrect) {
          newCorrectAnswers -= 1;
        }
      }

      // Add new answer to count
      if (correct) {
        newCorrectAnswers += 1;
      }

      setCorrectAnswers(newCorrectAnswers);

      // Update total answered (only count once per question)
      if (previousAnswer === null) {
        setTotalAnswered(totalAnswered + 1);
      }
    } else {
      // Regular mode - show immediate feedback and prevent multiple clicks
      if (showResult) return;

      setSelectedAnswer(answerIndex);
      const correct = answerIndex === currentQuestion.correctAnswerIndex;
      setIsCorrect(correct);
      setShowResult(true);

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
    }
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

    if (testMode) {
      // Test mode logic
      if (currentQuestionIndex < testQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(testQuestions[nextIndex]);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
      } else {
        // Test completed - check if all questions are answered
        if (totalAnswered >= testQuestions.length) {
          const percentage = (correctAnswers / totalAnswered) * 100;
          const wrongAnsweredQuestions = testQuestions.filter(q => {
            const userAnswer = userAnswers[q.id];
            return userAnswer !== undefined && userAnswer !== q.correctAnswerIndex;
          });
          setTestResults({
            correct: correctAnswers,
            total: totalAnswered,
            percentage: percentage,
            passed: percentage >= 70,
            wrongQuestions: wrongAnsweredQuestions
          });
        } else {
          // If not all questions are answered, stay on current question
          return;
        }
        setCurrentQuestion(null);
      }
    } else {
      // Regular mode logic
      const filteredQuestions = section === 'all'
        ? questions
        : questions.filter(q => q.sourceFile.startsWith(section));

      const unansweredQuestions = filteredQuestions.filter(q => !answeredQuestions.has(q.id));

      if (unansweredQuestions.length === 0) {
        setCurrentQuestion(null);
        return;
      }

      const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
      setCurrentQuestion(unansweredQuestions[randomIndex]);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const resetProgress = () => {
    setAnsweredQuestions(new Set());
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setTestResults(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswers({});
    setShowWrongAnswers(false);

    if (testMode) {
      initializeTestMode();
    } else {
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
    }
  };

  const handleSectionChange = (event) => {
    const newSection = event.target.value;
    setSelectedSection(newSection);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    loadNewQuestion(newSection);
  };

  const toggleTestMode = () => {
    setTestMode(!testMode);
    setTestResults(null);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions(new Set());
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswers({});
    setShowWrongAnswers(false);
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
    <div className={`App ${testMode ? 'test-mode' : ''}`}>
      <div className="quiz-header-handler">
        <div className="quiz-header">
          {!testMode && (
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
          )}
          {testMode && <div className="test-mode-controls">
            <label className="test-mode-toggle">
              <input
                type="checkbox"
                checked={testMode}
                onChange={toggleTestMode}
              />
              <span className="toggle-slider"></span>
              Test Mode
            </label>

          </div>}



          {!testMode && <div className='section-selector'>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="section-select"
              disabled={testMode}
            >
              <option value="all">All Sections</option>
              <option value="1">Section 1</option>
              <option value="2">Section 2</option>
              <option value="3">Section 3</option>
              <option value="4">Section 4</option>
              <option value="5">Section 5</option>
              <option value="6">Section 6</option>
            </select>
          </div>}
          <button className="reset-button" onClick={resetProgress}>
            Reset
          </button>
        </div>
        <div>
        {!testMode && <div className="test-mode-controls">
          <label className="test-mode-toggle">
            <input
              type="checkbox"
              checked={testMode}
              onChange={toggleTestMode}
            />
            <span className="toggle-slider"></span>
            Test Mode
          </label>
          
        </div>}
        </div>
      </div>


      <div className="quiz-container">
        {testResults && (
          <div className={`test-results ${testResults.passed ? 'passed' : 'failed'}`}>
            <h2>Test Complete!</h2>
            <div className="results-summary">
              <p>Correct Answers: <span className="correct-count">{testResults.correct}</span> / {testResults.total}</p>
              <p>Percentage: <span className={`percentage ${testResults.passed ? 'passed' : 'failed'}`}>
                {testResults.percentage.toFixed(1)}%
              </span></p>
              <p className={`result-status ${testResults.passed ? 'passed' : 'failed'}`}>
                {testResults.passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
            
            {testResults.wrongQuestions && testResults.wrongQuestions.length > 0 && (
              <div className="wrong-answers-section">
                <button 
                  className="toggle-wrong-answers"
                  onClick={() => setShowWrongAnswers(!showWrongAnswers)}
                >
                  {showWrongAnswers ? 'Hide' : 'Show'} Wrong Answers ({testResults.wrongQuestions.length})
                </button>
                
                {showWrongAnswers && (
                  <div className="wrong-questions-list">
                    <h3>Questions Answered Incorrectly:</h3>
                    {testResults.wrongQuestions.map((question, index) => (
                      <div key={question.id} className="wrong-question-item">
                        <div className="question-header">
                          <div className="question-group">{question.questionGroup}</div>
                          <div className="source-file">Source: {question.sourceFile}</div>
                        </div>
                        <h4 className="question">{question.question}</h4>
                        <div className="answers">
                          {question.answers.map((answer, answerIndex) => {
                            const isUserAnswer = userAnswers[question.id] === answerIndex;
                            const isCorrectAnswer = answerIndex === question.correctAnswerIndex;
                            let className = 'answer-button';
                            
                            if (isUserAnswer && isCorrectAnswer) {
                              className += ' correct';
                            } else if (isUserAnswer && !isCorrectAnswer) {
                              className += ' incorrect';
                            } else if (isCorrectAnswer) {
                              className += ' correct';
                            }
                            
                            return (
                              <button
                                key={answerIndex}
                                className={className}
                                disabled={true}
                              >
                                {answer}
                                {isUserAnswer && <span className="user-answer-indicator"> (Your Answer)</span>}
                                {isCorrectAnswer && <span className="correct-answer-indicator"> (Correct)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button className="reset-button" onClick={resetProgress}>
              Retake Test
            </button>
          </div>
        )}

        {currentQuestion && !testResults && (
          <div className="question-section">
            {testMode && (
              <div className="question-index">
                Question {currentQuestionIndex + 1} of {testQuestionsCount}
              </div>
            )}

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
                    ? showResult && !testMode
                      ? isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : 'selected'
                    : showResult && !testMode && index === currentQuestion.correctAnswerIndex
                      ? 'correct'
                      : ''
                    }`}
                  onClick={() => handleAnswerClick(index)}
                  disabled={showResult && !testMode}
                >
                  {answer}
                </button>
              ))}
            </div>

            <button 
              className={`reload-button ${selectedAnswer === null ? 'disabled' : ''}`} 
              onClick={loadNewQuestion}
              disabled={selectedAnswer === null}
            >
              {selectedAnswer === null 
                ? 'Please select an answer'
                : testMode
                  ? (currentQuestionIndex === testQuestions.length - 1 ? 'Finish Test' : 'Next Question')
                  : 'Next Question'
              }
            </button>
          </div>
        )}

        {/* Show completion message when all questions are answered */}
        {!currentQuestion && !testResults && questions.length > 0 && !testMode && (
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
