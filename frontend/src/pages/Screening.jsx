import React, { useEffect, useMemo, useState } from 'react';
import { submitScreening, getMyScreenings } from '../api/screeningApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
  { value: 0, label: '0: Not at all' },
  { value: 1, label: '1: Several days' },
  { value: 2, label: '2: More than half the days' },
  { value: 3, label: '3: Nearly every day' }
];

export default function Screening() {
  const { token, user } = useAuth();
  // initialize with PHQ9 by default
  const [type, setType] = useState('PHQ9');
  const questions = useMemo(() => (type === 'PHQ9' ? PHQ9 : GAD7), [type]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // if switching type, reset
  useEffect(() => {
    setIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setResult(null);
  }, [type]);

  useEffect(() => {
    // fetch user screenings if logged in
    if (token) {
      getMyScreenings(token).then(res => setHistory(res.data.data)).catch(() => { });
    }
  }, [token]);

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
      if (total <= 4) return 'None';
      if (total <= 9) return 'Mild';
      if (total <= 14) return 'Moderate';
      if (total <= 19) return 'Moderately severe';
      return 'Severe';
    } else {
      if (total <= 4) return 'Minimal';
      if (total <= 9) return 'Mild';
      if (total <= 14) return 'Moderate';
      return 'Severe';
    }
  };

  const handleSubmit = async () => {
    const filled = answers.every(a => a !== null);
    if (!filled) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    const payload = {
      type,
      answers: answers.map((score, i) => ({ questionId: `${type}_${i + 1}`, score: Number(score) }))
    };
    try {
      const res = await submitScreening(payload, token);
      setResult({
        totalScore: res.data.data.totalScore,
        severity: res.data.data.severity,
        resultMeta: res.data.data.resultMeta
      });
      // refresh history
      if (token) {
        const h = await getMyScreenings(token);
        setHistory(h.data.data);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit. If you are not logged in, your result is saved anonymously in this session.');
      // fallback: compute locally
      setResult({
        totalScore: computeTotal(),
        severity: severity(type, computeTotal()),
        resultMeta: { recommended: computeTotal() >= (type === 'PHQ9' ? 10 : 10) ? 'Consult counselor' : 'Self-care' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Self-Assessment Screening (PHQ-9 / GAD-7)</h1>
              <p className="text-gray-600 mt-1">Answer a few short questions to understand your mental health status.</p>
            </div>
            {/* <div className="text-sm text-gray-600">
              {user ? <div>Signed in as <strong>{user.fullName}</strong></div> : <Link to="/login" className="text-blue-600">Sign in / Create account</Link>}
            </div> */}
          </div>

          {/* select type */}
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-gray-700">Test</label>
            <div className="flex gap-2">
              <button onClick={() => setType('PHQ9')}
                className={`px-4 py-2 rounded ${type === 'PHQ9' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>PHQ-9</button>
              <button onClick={() => setType('GAD7')}
                className={`px-4 py-2 rounded ${type === 'GAD7' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>GAD-7</button>
            </div>
          </div>

          {/* progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">Question {answeredCount > index ? index + 1 : index + 1} of {questions.length}</div>
              <div className="text-sm text-gray-600">{progress}%</div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"></div>
            </div>
          </div>

          {/* card */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">{questions[index]}</h2>

            <div className="space-y-3">
              {options.map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${answers[index] === opt.value ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-100'}`}>
                  <input
                    type="radio"
                    name={`q_${index}`}
                    checked={answers[index] === opt.value}
                    onChange={() => setAnswer(index, opt.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* controls */}
            <div className="mt-6 flex justify-between items-center">
              <button onClick={handleBack} disabled={index === 0}
                className={`px-5 py-2 rounded border ${index === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}>← Back</button>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 mr-4">Answered: {answeredCount}/{questions.length}</div>
                {index < questions.length - 1 ? (
                  <button onClick={handleNext} disabled={answers[index] === null}
                    className={`px-6 py-2 rounded text-white ${answers[index] === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    Next →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || !answers.every(a => a !== null)}
                    className={`px-6 py-2 rounded text-white ${(!answers.every(a => a !== null) || submitting) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* result */}
          {result && (
            <div className="mt-8 p-6 bg-white border rounded-lg shadow">
              <h3 className="text-2xl font-semibold">Your Result</h3>
              <div className="mt-3 flex items-center gap-6">
                <div className="p-4 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded w-40 text-center">
                  <div className="text-4xl font-bold">{result.totalScore}</div>
                  <div className="text-sm text-gray-600">Total score</div>
                </div>
                <div>
                  <div className="text-lg">Severity: <strong>{result.severity}</strong></div>
                  <div className="text-sm text-gray-600 mt-2">{result.resultMeta?.recommended}</div>
                  <div className="mt-4">
                    <Link to="/booking" className="px-4 py-2 bg-indigo-600 text-white rounded mr-3">Book Counseling</Link>
                    <Link to="/resources" className="px-4 py-2 border rounded">Self-help resources</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* history */}
          {history && history.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-3">Recent screenings</h4>
              <div className="space-y-3">
                {history.slice(0, 5).map(h => (
                  <div key={h._id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{h.type} • {h.severity}</div>
                      <div className="text-sm text-gray-500">Score: {h.totalScore} • {new Date(h.createdAt).toLocaleString()}</div>
                    </div>
                    <Link to={`/screenings/${h._id}`} className="text-indigo-600">View</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
