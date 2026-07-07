import { Link, useNavigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="w-full px-6 pt-6 z-50">
      <header className="max-w-5xl mx-auto glass-panel rounded-full px-5 py-2.5 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="bg-slate-800/5 p-1.5 rounded-full group-hover:bg-slate-800/10 transition-all duration-300">
            <Landmark className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-800/90 group-hover:text-slate-900 transition-all">
            People's Priorities
          </span>
        </Link>
        <nav>
          {token ? (
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition duration-300">Dashboard</Link>
              <button 
                onClick={handleLogout} 
                className="bg-white/50 hover:bg-white/80 text-slate-800 text-sm px-4 py-1.5 rounded-full font-semibold transition duration-300 backdrop-blur-md border border-slate-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/40 hover:bg-white/80 px-3 py-1.5 rounded-full transition duration-300 border border-slate-200/50">
              Admin Access
            </Link>
          )}
        </nav>
      </header>
    </div>
  );
};

export default Header;

