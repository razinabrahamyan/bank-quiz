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
      if (questionsData.length > 0) {
        setCurrentQuestion(questionsData[Math.floor(Math.random() * questionsData.length)]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setDebugInfo(`Error loading questions: ${error.message}. Please run 'python process_excel.py' first.`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswerClick = (answerIndex) => {
    if (showResult) return; // Prevent multiple clicks
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const loadNewQuestion = () => {
    if (questions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading questions...</h2>
          <div className="spinner"></div>
          <p style={{marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.8)'}}>
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
          <div style={{marginTop: '20px', textAlign: 'left', maxWidth: '600px', fontSize: '12px', color: 'rgba(255,255,255,0.8)'}}>
            <strong>Steps:</strong>
            <ol style={{textAlign: 'left', marginTop: '10px'}}>
              <li>Install Python dependencies: <code>pip install -r requirements.txt</code></li>
              <li>Run the processor: <code>python process_excel.py</code></li>
              <li>Refresh this page</li>
            </ol>
            <strong>Debug Info:</strong>
            <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
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
      <div className="quiz-container">
        
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
                  className={`answer-button ${
                    selectedAnswer === index
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
      </div>
    </div>
  );
}

export default App;
