import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://peoples-priorities-backend-ejsprvcwza-el.a.run.app';
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="glass-panel p-10 rounded-3xl w-full max-w-md transform transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-500/10 p-4 rounded-full shadow-sm backdrop-blur-md border border-indigo-500/20">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-800 mb-6 tracking-tight">Admin Portal</h2>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-center text-sm text-indigo-800 shadow-sm">
          <p className="font-bold mb-1">Hackathon Demo Credentials</p>
          <p>Username: <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">admin</span></p>
          <p className="mt-1">Password: <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">admin123</span></p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-xl mb-6 text-sm text-center backdrop-blur-sm animate-pulse font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Username</label>
            <input 
              type="text" 
              className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full glass-button py-3 rounded-2xl font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
