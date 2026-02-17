import './App.css';
import { LogIn, UserPlus } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="font-heading text-5xl font-bold text-primary-white mb-4">
          EventManager
        </h1>
        <p className="text-lg text-primary-gray mb-8">
          Application de gestion d'événements internes
        </p>
        <div className="space-y-4">
          <button className="w-full bg-primary-accent hover:bg-[#0098C7] text-primary-white font-medium px-6 py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2">
            <LogIn size={20} />
            Connexion
          </button>
          <button className="w-full bg-primary-light hover:bg-[#d1d0d8] text-primary-dark font-medium px-6 py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2">
            <UserPlus size={20} />
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
