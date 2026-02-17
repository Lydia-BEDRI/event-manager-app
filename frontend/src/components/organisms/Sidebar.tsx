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

interface SidebarProps {
  role?: 'admin' | 'participant';
}

const Sidebar: React.FC<SidebarProps> = ({ role = 'participant' }) => {
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: CalendarDays, label: 'Événements', active: false },
    { icon: Users, label: 'Participants', active: false },
    { icon: MapPin, label: 'Zones', active: false },
    { icon: ClipboardCheck, label: 'Présences', active: false },
    { icon: MessageCircle, label: 'Chats', active: false },
    { icon: FileDown, label: 'Exports', active: false },
  ];

  const participantMenuItems = [
    { icon: Home, label: 'Accueil', active: true },
    { icon: CalendarDays, label: 'Événements disponibles', active: false },
    { icon: Ticket, label: 'Mes participations', active: false },
    { icon: QrCode, label: 'Mes QR Codes', active: false },
    { icon: ScanLine, label: 'Vérifier ma présence', active: false },
    { icon: MessageCircle, label: 'Chats', active: false },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : participantMenuItems;

  return (
    <aside className="bg-primary-dark w-64 h-[calc(100vh-3rem)] flex flex-col rounded-l-3xl flex-none overflow-y-auto">
      <div className="h-16 flex items-center justify-center px-6">
        <Logo size="large" variant="dark" />
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
              <NavItem icon={Shield} label="Politique de confidentialité" />
            </li>
            <li>
              <NavItem icon={ScrollText} label="Mentions légales" />
            </li>
            <li>
              <NavItem icon={Cookie} label="Gestion des cookies" />
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-3">
        <NavItem icon={Settings} label={role === 'admin' ? 'Paramètres' : 'Mon profil'} />
        <div className="mt-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-primary-gray hover:bg-red-500/10 hover:text-red-400 transition-all text-left">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
