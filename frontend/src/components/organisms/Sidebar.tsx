import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  MapPin, 
  ClipboardCheck, 
  MessageCircle, 
  FileDown, 
  Settings,
  LogOut,
  Shield,
  ScrollText,
  Cookie,
  QrCode,
  Home,
  Ticket,
  ScanLine
} from 'lucide-react';
import Logo from '../atoms/Logo';
import NavItem from '../molecules/NavItem';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  role?: 'ADMIN' | 'PARTICIPANT';
}

const Sidebar: React.FC<SidebarProps> = ({ role = 'PARTICIPANT' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: CalendarDays, label: 'Événements', to: '/events' },
    { icon: Users, label: 'Participants', to: '/participants' },
    { icon: MapPin, label: 'Zones', to: '/zones' },
    { icon: ClipboardCheck, label: 'Présences' },
    { icon: MessageCircle, label: 'Chats' },
    { icon: FileDown, label: 'Exports', to: '/exports' },
  ];

  const participantMenuItems = [
    { icon: Home, label: 'Accueil', to: '/' },
    { icon: CalendarDays, label: 'Événements disponibles' },
    { icon: Ticket, label: 'Mes participations' },
    { icon: QrCode, label: 'Mes QR Codes' },
    { icon: ScanLine, label: 'Vérifier ma présence' },
    { icon: MessageCircle, label: 'Chats' },
  ];

  const menuItems = role === 'ADMIN' ? adminMenuItems : participantMenuItems;

  return (
    <aside className="bg-primary-dark w-64 h-[calc(100vh-3rem)] flex flex-col rounded-l-3xl flex-none overflow-y-auto">
      <div className="h-16 flex items-center justify-center px-6">
        <Logo size="large" variant="dark_text" />
      </div>

      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavItem {...item} />
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-6 border-t border-primary-gray/20">
          <p className="text-primary-gray text-xs uppercase font-medium px-3 mb-3">
            Légal & Confidentialité
          </p>
          <ul className="space-y-1">
            <li>
              <NavItem icon={Shield} label="Politique de confidentialité" to="/privacy" />
            </li>
            <li>
              <NavItem icon={ScrollText} label="Mentions légales" to="/legal" />
            </li>
            <li>
              <NavItem icon={Cookie} label="Gestion des cookies" to="/cookies" />
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-3">
        <NavItem 
          icon={Settings} 
          label={role === 'ADMIN' ? 'Paramètres' : 'Mon profil'} 
          to={role === 'ADMIN' ? undefined : '/profile'} 
        />
        <div className="mt-1">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-primary-gray hover:bg-red-500/10 hover:text-red-400 transition-all text-left"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
