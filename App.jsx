import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Metrics we audit on
const AUDIT_METRICS = [
  'Phone Number Presence',
  'Mobile Responsiveness',
  'SEO Basics (Meta Tags & Schema)',
  'Reservation System',
  'Online Ordering',
  'Menu Accessibility',
  'High Quality Images',
  'Local Business Schema',
  'Social Media Links',
  'Site Speed',
  'Content Freshness',
  'Accessibility Standards',
  'E-commerce Integration',
  'Contact Form/Email',
  'Reviews & Testimonials',
];

function GoogleOAuthButton({ onSuccess }) {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('OAuth error:', error);
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
    >
      Sign in with Google
    </button>
  );
}

function PublicAuditTool() {
  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!restaurantName || !location) {
      alert('Please enter restaurant name and location');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-restaurant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            restaurantName,
            location,
          }),
        }
      );

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      setResults(data);
      setShowEmailGate(true);
    } catch (error) {
      console.error('Audit failed:', error);
      alert('Audit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setEmailSubmitting(true);
    try {
      // Save to Supabase
      await supabase.from('email_signups').insert([{ email }]);
      await supabase.from('restaurant_audits').insert([
        {
          email,
          restaurant_name: restaurantName,
          location,
          audit_scores: results.scores,
          total_score: results.totalScore,
          audit_details: results.details,
        },
      ]);

      // Submit to Netlify Forms (will trigger GHL webhook)
      const formData = new FormData();
      formData.append('form-name', 'audit-signup');
      formData.append('email', email);
      formData.append('restaurant_name', restaurantName);
      formData.append('location', location);
      formData.append('score', results.totalScore);

      await fetch('/', {
        method: 'POST',
        body: formData,
      });

      alert(
        'Perfect! Check your email for the full audit report. We also saved your details for next steps.'
      );
      setShowEmailGate(false);
      setEmail('');
      setRestaurantName('');
      setLocation('');
      setResults(null);
    } catch (error) {
      console.error('Email submission failed:', error);
      alert('Failed to save email. Please try again.');
    } finally {
      setEmailSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Restaurant Web Audit</h1>
          <p className="text-lg text-slate-300">
            See how your restaurant's website stacks up. Get a free 15-point audit in seconds.
          </p>
        </div>

        {/* Search Form */}
        {!showEmailGate && (
          <form
            onSubmit={handleAudit}
            className="bg-slate-700 rounded-xl shadow-2xl p-8 mb-8"
          >
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g., Chef Tony's Fresh Seafood"
                className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Rockville, MD"
                className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition ${
                loading
                  ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Auditing...' : 'Get Free Audit'}
            </button>
          </form>
        )}

        {/* Results Display */}
        {results && !showEmailGate && (
          <div className="bg-slate-700 rounded-xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {restaurantName} - {location}
            </h2>

            <div className="mb-8 p-6 bg-slate-600 rounded-lg">
              <div className="text-center">
                <p className="text-slate-300 text-sm mb-2">Overall Score</p>
                <p className="text-5xl font-bold text-white">
                  {results.totalScore}/{AUDIT_METRICS.length}
                </p>
                <div className="w-full bg-slate-500 rounded-full h-3 mt-4">
                  <div
                    className={`h-3 rounded-full transition ${
                      results.totalScore >= 12
                        ? 'bg-green-500'
                        : results.totalScore >= 8
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${(results.totalScore / AUDIT_METRICS.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Audit Breakdown</h3>
            <div className="space-y-3">
              {AUDIT_METRICS.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-600 rounded">
                  <span className="text-white">{metric}</span>
                  <span
                    className={`font-bold ${
                      results.scores[metric] ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {results.scores[metric] ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowEmailGate(true)}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Unlock Full Report
            </button>
          </div>
        )}

        {/* Email Gate */}
        {showEmailGate && (
          <form
            onSubmit={handleEmailSubmit}
            className="bg-slate-700 rounded-xl shadow-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Get Your Full Report</h2>
            <p className="text-slate-300 mb-6">
              Enter your email to receive the complete audit report and actionable next steps.
            </p>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={emailSubmitting}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition ${
                emailSubmitting
                  ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {emailSubmitting ? 'Sending...' : 'Send Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterScore, setFilterScore] = useState('all');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      let query = supabase.from('restaurant_audits').select('*').order('created_at', {
        ascending: false,
      });

      const { data, error } = await query;
      if (error) throw error;

      setAudits(data || []);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter((audit) => {
    if (filterScore === 'hot') return audit.total_score >= 12;
    if (filterScore === 'warm') return audit.total_score >= 8 && audit.total_score < 12;
    if (filterScore === 'cold') return audit.total_score < 8;
    return true;
  });

  const exportToCSV = () => {
    const csv = [
      ['Restaurant', 'Location', 'Email', 'Score', 'Date'],
      ...audits.map((a) => [
        a.restaurant_name,
        a.location,
        a.email,
        a.total_score,
        new Date(a.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-prospects.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Prospect Dashboard</h1>
            <p className="text-slate-300">
              Logged in as {user.email}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Prospects</option>
            <option value="hot">Hot Leads (12+)</option>
            <option value="warm">Warm Leads (8-11)</option>
            <option value="cold">Cold Leads (&lt;8)</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Export to CSV
          </button>

          <button
            onClick={fetchAudits}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Total Audits</p>
            <p className="text-3xl font-bold text-white">{audits.length}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Hot Leads</p>
            <p className="text-3xl font-bold text-green-400">
              {audits.filter((a) => a.total_score >= 12).length}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Warm Leads</p>
            <p className="text-3xl font-bold text-yellow-400">
              {audits.filter((a) => a.total_score >= 8 && a.total_score < 12).length}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Cold Leads</p>
            <p className="text-3xl font-bold text-red-400">
              {audits.filter((a) => a.total_score < 8).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-300">Loading prospects...</div>
          ) : filteredAudits.length === 0 ? (
            <div className="p-8 text-center text-slate-300">No prospects found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-white font-semibold">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Location</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Score</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((audit, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-slate-600 ${
                        idx % 2 === 0 ? 'bg-slate-700' : 'bg-slate-750'
                      } hover:bg-slate-650 transition`}
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {audit.restaurant_name}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{audit.location}</td>
                      <td className="px-6 py-4 text-slate-300">{audit.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-bold text-white ${
                            audit.total_score >= 12
                              ? 'bg-green-600'
                              : audit.total_score >= 8
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {audit.total_score}/15
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-2xl">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={async () => {
          await supabase.auth.signOut();
          setUser(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <PublicAuditTool />
    </div>
  );
}
