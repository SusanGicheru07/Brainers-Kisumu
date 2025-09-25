import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import { Eye, EyeOff, Hospital } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.login(formData);
            login(response.user, response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo and branding */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <Hospital className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Matricare</span>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Login</h2>
                    <p className="text-gray-600 text-sm">Access your secure health portal.</p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-soft rounded-2xl border border-gray-100">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Email or Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Email or Username"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors duration-200"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Log In'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <div className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-teal-600 hover:text-teal-500 transition-colors duration-200"
                            >
                                Create your patient account
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <Link
                                to="/hospital-signup"
                                className="block w-full text-center text-teal-600 hover:text-teal-500 transition-colors duration-200"
                            >
                                Register your hospital
                            </Link>
                            <Link
                                to="/staff-request-access"
                                className="block w-full text-center text-teal-600 hover:text-teal-500 transition-colors duration-200"
                            >
                                Request staff access
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;