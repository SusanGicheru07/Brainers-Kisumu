import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Hospital, Users, Calendar, BarChart3, Map, Settings, LogOut, CalendarCheck } from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Hospital Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'County Dashboard', href: '/county-dashboard', icon: Map },
        { name: 'Weekly Visits', href: '/weekly-visits', icon: Calendar },
        { name: 'Patient Management', href: '/patients', icon: Users },
        { name: 'Appointments', href: '/appointments', icon: CalendarCheck },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-center border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <Hospital className="h-8 w-8 text-teal-600" />
                            <span className="text-xl font-bold text-gray-900">Matricare</span>
                        </div>
                    </div>

                    {/* User info */}
                    <div className="border-b border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-teal-800">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.user_type?.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 p-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.href)}
                                    className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${isActive
                                        ? 'bg-teal-100 text-teal-900'
                                        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-900'
                                        }`}
                                >
                                    <Icon
                                        className={`mr-3 h-5 w-5 ${isActive ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-500'
                                            }`}
                                    />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="border-t border-gray-200 p-4">
                        <button
                            onClick={handleLogout}
                            className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-900"
                        >
                            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-teal-500" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="ml-64">
                <div className="min-h-screen bg-gray-50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;