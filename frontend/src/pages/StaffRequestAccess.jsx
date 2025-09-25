import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import { Hospital, User, Mail, Phone, MapPin } from 'lucide-react';

const StaffRequestAccess = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        hospitals: [],
    });
    const [hospitals, setHospitals] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const roleOptions = [
        { value: 'nurse', label: 'Nurse' },
        { value: 'doctor', label: 'Doctor' },
        { value: 'midwife', label: 'Midwife' },
        { value: 'clinical_officer', label: 'Clinical Officer' },
        { value: 'health_records_officer', label: 'Health Records Officer' },
        { value: 'lab_technician', label: 'Lab Technician' },
        { value: 'pharmacist', label: 'Pharmacist' },
        { value: 'other', label: 'Other' },
    ];

    useEffect(() => {
        // Fetch available hospitals for selection
        const fetchHospitals = async () => {
            try {
                const response = await apiClient.getHospitals();
                setHospitals(response || []);
            } catch (err) {
                console.error('Error fetching hospitals:', err);
            }
        };

        fetchHospitals();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setError('');
    };

    const handleHospitalChange = (e) => {
        const selectedHospitalIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData({
            ...formData,
            hospitals: selectedHospitalIds,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (!formData.name || !formData.email || !formData.role || formData.hospitals.length === 0) {
            setError('Please fill in all required fields and select at least one hospital.');
            setLoading(false);
            return;
        }

        try {
            await apiClient.requestStaffAccess(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/access-pending');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit access request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="bg-white shadow-soft rounded-2xl border border-gray-100 p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                            <p className="text-gray-600">
                                Your access request has been sent to the hospital administrators.
                                You will be redirected to the pending access page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                            <Hospital className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Matricare Hospital</h1>
                            <p className="text-sm text-gray-600">Management System</p>
                        </div>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                    Request Hospital Access
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Submit your request to access hospital data
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <div className="mt-1 relative">
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
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address *
                            </label>
                            <div className="mt-1 relative">
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
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role/Position *
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="">Select your role</option>
                                {roleOptions.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="hospitals" className="block text-sm font-medium text-gray-700">
                                Select Hospital(s) *
                            </label>
                            <select
                                id="hospitals"
                                name="hospitals"
                                multiple
                                required
                                value={formData.hospitals}
                                onChange={handleHospitalChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 h-32"
                            >
                                {hospitals.map((hospital) => (
                                    <option key={hospital.id} value={hospital.id}>
                                        {hospital.name} - {hospital.county}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                Hold Ctrl (Cmd on Mac) to select multiple hospitals
                            </p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit Access Request'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-teal-600 hover:text-teal-500 text-sm"
                            >
                                Already have access? Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffRequestAccess;