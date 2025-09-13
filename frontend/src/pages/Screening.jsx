import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
const PHQ9 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly or being fidgety/restless",
  "Thoughts that you would be better off dead or hurting yourself"
];

const GAD7 = [
  "Feeling nervous, anxious or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const options = [
  { value: 0, label: 'Not at all', emoji: '😊' },
  { value: 1, label: 'Several days', emoji: '😐' },
  { value: 2, label: 'More than half the days', emoji: '😔' },
  { value: 3, label: 'Nearly every day', emoji: '😰' }
];

export default function Screening() {
  // Mock auth context
  const token = null;
  const user = null;
  
  const [type, setType] = useState('PHQ9');
  const questions = useMemo(() => (type === 'PHQ9' ? PHQ9 : GAD7), [type]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    setIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setResult(null);
    setShowWelcome(true);
  }, [type, questions.length]);

  const answeredCount = answers.filter(a => a !== null).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const setAnswer = (i, value) => {
    const copy = [...answers];
    copy[i] = value;
    setAnswers(copy);
  };

  const handleNext = () => {
    if (index < questions.length - 1) setIndex(i => i + 1);
  };

  const handleBack = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  const computeTotal = () => answers.reduce((s, a) => s + (Number(a) || 0), 0);

  const severity = (type, total) => {
    if (type === 'PHQ9') {
      if (total <= 4) return { level: 'None', color: 'text-green-600', bg: 'bg-green-50' };
      if (total <= 9) return { level: 'Mild', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (total <= 14) return { level: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50' };
      if (total <= 19) return { level: 'Moderately severe', color: 'text-red-600', bg: 'bg-red-50' };
      return { level: 'Severe', color: 'text-red-700', bg: 'bg-red-100' };
    } else {
      if (total <= 4) return { level: 'Minimal', color: 'text-green-600', bg: 'bg-green-50' };
      if (total <= 9) return { level: 'Mild', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (total <= 14) return { level: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { level: 'Severe', color: 'text-red-600', bg: 'bg-red-50' };
    }
  };

  const handleSubmit = async () => {
    const filled = answers.every(a => a !== null);
    if (!filled) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const total = computeTotal();
      const sev = severity(type, total);
      setResult({
        totalScore: total,
        severity: sev.level,
        color: sev.color,
        bg: sev.bg,
        resultMeta: { 
          recommended: total >= (type === 'PHQ9' ? 10 : 10) ? 'Consider consulting a mental health professional' : 'Continue with self-care practices' 
        }
      });
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  };

  const handleStartAssessment = () => {
    setShowWelcome(false);
  };
  const navigate = useNavigate(); 
  const handleBookAppointment = () => {
   navigate("/booking");
  }
  const handleSelfhelp = () => {
    navigate("/resources");
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Floating particles animation */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-40"></div>
            <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-50"></div>
            <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-30"></div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                Mental Health Assessment
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Take a moment for yourself. This confidential screening will help you understand your mental well-being using clinically validated assessments.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">PHQ</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">PHQ-9 Depression</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Assess symptoms of depression over the past two weeks using this clinically validated 9-question screening tool.</p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">GAD</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">GAD-7 Anxiety</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Evaluate anxiety symptoms and their impact on your daily life with this 7-question assessment tool.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setType('PHQ9')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      type === 'PHQ9' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    Start with PHQ-9
                  </button>
                  <button 
                    onClick={() => setType('GAD7')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      type === 'GAD7' 
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    Start with GAD-7
                  </button>
                </div>
              </div>

              <button 
                onClick={handleStartAssessment}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Begin Assessment →
              </button>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                    </svg>
                    Completely Confidential
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Clinically Validated
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                    5 minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button 
              onClick={() => setShowWelcome(true)}
              className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center mx-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to start
            </button>
            
            <div className="inline-flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'PHQ9' ? 'bg-blue-500' : 'bg-green-500'}`}>
                <span className="text-white font-bold text-sm">{type === 'PHQ9' ? 'PHQ' : 'GAD'}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {type === 'PHQ9' ? 'PHQ-9 Depression Assessment' : 'GAD-7 Anxiety Assessment'}
              </h1>
            </div>
            
            {/* Test switcher */}
            <div className="flex justify-center gap-2 mb-6">
              <button 
                onClick={() => setType('PHQ9')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  type === 'PHQ9' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                }`}
              >
                PHQ-9
              </button>
              <button 
                onClick={() => setType('GAD7')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  type === 'GAD7' 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                }`}
              >
                GAD-7
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white">
                <span className="text-2xl font-bold">{index + 1}</span>
                <span className="text-gray-300 ml-1">of {questions.length}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{progress}%</div>
                <div className="text-sm text-gray-300">Complete</div>
              </div>
            </div>
            
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                style={{ width: `${progress}%` }} 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-lg"
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Started</span>
              <span>{answeredCount} answered</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 mb-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <span className="text-gray-400 text-sm">Over the last 2 weeks, how often have you been bothered by:</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                {questions[index]}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {options.map(opt => (
                <label 
                  key={opt.value} 
                  className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                    answers[index] === opt.value 
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 shadow-lg' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    answers[index] === opt.value 
                      ? 'border-purple-400 bg-purple-500' 
                      : 'border-gray-400 group-hover:border-gray-300'
                  }`}>
                    {answers[index] === opt.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  
                  <span className="text-2xl">{opt.emoji}</span>
                  
                  <div className="flex-1">
                    <div className="text-white font-medium">{opt.label}</div>
                    <div className="text-gray-400 text-sm">Score: {opt.value}</div>
                  </div>
                  
                  <input
                    type="radio"
                    name={`q_${index}`}
                    checked={answers[index] === opt.value}
                    onChange={() => setAnswer(index, opt.value)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button 
                onClick={handleBack} 
                disabled={index === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  index === 0 
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-500' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex items-center gap-4">
                <div className="text-gray-400 text-sm">
                  {answeredCount}/{questions.length} answered
                </div>
                
                {index < questions.length - 1 ? (
                  <button 
                    onClick={handleNext} 
                    disabled={answers[index] === null}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      answers[index] === null 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'
                    }`}
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting || !answers.every(a => a !== null)}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                      (!answers.every(a => a !== null) || submitting) 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg hover:shadow-green-500/25 transform hover:scale-105'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Complete Assessment
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-in slide-in-from-bottom duration-700">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Assessment Complete</h3>
                <p className="text-gray-300">Here are your results based on your responses</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-2">{result.totalScore}</div>
                    <div className="text-blue-300 text-sm uppercase tracking-wide">Total Score</div>
                    <div className="mt-4 text-xs text-gray-400">
                      Range: 0-{type === 'PHQ9' ? '27' : '21'}
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 border ${result.bg} ${result.color.replace('text-', 'border-')}/30`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${result.color} mb-2`}>{result.severity}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Severity Level</div>
                    <div className="mt-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${result.bg} ${result.color}`}>
                        {type === 'PHQ9' ? 'Depression' : 'Anxiety'} Assessment
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h4 className="font-semibold text-white mb-3">Recommendation</h4>
                <p className="text-gray-300 leading-relaxed">{result.resultMeta?.recommended}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleBookAppointment()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                >
                  Book Counseling Session
                </button>
                <button 
                  onClick={() => handleSelfhelp()}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium border border-white/20 transition-all duration-300 text-center"
                >
                  Self-Help Resources
                </button>
                <button 
                  onClick={() => {
                    setResult(null);
                    setAnswers(Array(questions.length).fill(null));
                    setIndex(0);
                    setShowWelcome(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium border border-white/20 transition-all duration-300"
                >
                  Take Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}