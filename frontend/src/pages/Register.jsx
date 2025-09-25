import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import { Eye, EyeOff, Hospital, User, Mail, Briefcase, MapPin } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        hospital: '',
        password: '',
        password2: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const roleOptions = [
        { value: 'doctor', label: 'Doctor' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'midwife', label: 'Midwife' },
        { value: 'obstetrician', label: 'Obstetrician' },
        { value: 'lab_technician', label: 'Lab Technician' },
        { value: 'pharmacist', label: 'Pharmacist' },
        { value: 'other', label: 'Other' },
    ];

    const hospitalOptions = [
        { value: 'aar_eldoret', label: 'AAR Eldoret' },
        { value: 'aga_khan_hospital', label: 'Aga Khan Hospital(T-mall)' },
        { value: 'baharini_dispensary', label: 'Baharini Dispensary' },
        { value: 'kahawa_west_health_centre', label: 'Kahawa West Health Centre' },
        { value: 'kayole_i_health_centre', label: 'Kayole I Health Centre' },
        { value: 'kayole_ii_sub_county_hospital', label: 'Kayole II Sub County Hospital' },
        { value: 'kiminini_health_services', label: 'Kiminini Health Services' },
        { value: 'kinyoni_dispensary', label: 'Kinyoni Dispensary' },
        { value: 'kirima_ndunuri_dispensary', label: 'Kirima Ndunuri Dispensary' },
        { value: 'lanet_medical_centre', label: 'Lanet Medical Centre' },
        { value: 'mama_racheal_ruto_maternity_hospital', label: 'Mama Racheal Ruto Maternity Hospital' },
        { value: 'marie_stopes_health_centre_eldoret_west', label: 'Marie Stopes Health Centre (Eldoret West)' },
        { value: 'moi_teaching_refferal_hospital', label: 'Moi Teaching Refferal Hospital' },
        { value: 'naivasha_district_hospital', label: 'Naivasha District Hospital' },
        { value: 'nakumed_diagnostic_and_health_centre', label: 'Nakumed Diagnostic And Health Centre' },
        { value: 'ngong_road_dispensary', label: 'Ngong Road Dispensary' },
        { value: 'njiru_hospital', label: 'Njiru Hospital' },
        { value: 'uasin_gishu_district_hospital', label: 'Uasin Gishu District Hospital' },
    ];

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

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await apiClient.register(formData);
            navigate('/login', {
                state: {
                    message: 'Registration successful! Please log in with your credentials.'
                }
            });
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Worker Registration</h2>
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-600 hover:text-teal-500 font-medium">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-white py-10 px-8 shadow-lg rounded-2xl border border-gray-100">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email address"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Role Field */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                Role/Position
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 bg-white appearance-none"
                                >
                                    <option value="">Select your role</option>
                                    {roleOptions.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Hospital Field */}
                        <div>
                            <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                                Hospital
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    id="hospital"
                                    name="hospital"
                                    required
                                    value={formData.hospital}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 bg-white appearance-none"
                                >
                                    <option value="">Select your hospital</option>
                                    {hospitalOptions.map((hospital) => (
                                        <option key={hospital.value} value={hospital.value}>
                                            {hospital.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        placeholder="Create a password"
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

                            <div>
                                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password2"
                                        name="password2"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password2}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
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
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Register as Hospital Worker'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;