import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Eye,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

const PatientManagement = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [patientsPerPage] = useState(10);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientModal, setShowPatientModal] = useState(false);

    const statusOptions = [
        { value: 'all', label: 'All Patients' },
        { value: 'recent', label: 'Recent (Last 7 days)' },
        { value: 'this_month', label: 'This Month' },
    ];

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getPatients();
            setPatients(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch patients');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient => {
        const matchesSearch =
            patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone?.includes(searchTerm);

        let matchesFilter = true;
        if (filterStatus === 'recent') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesFilter = new Date(patient.date_registered) >= weekAgo;
        } else if (filterStatus === 'this_month') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            matchesFilter = new Date(patient.date_registered) >= monthStart;
        }

        return matchesSearch && matchesFilter;
    });

    // Pagination
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };



    const handleViewPatient = (patient) => {
        setSelectedPatient(patient);
        setShowPatientModal(true);
    };

    const handleEditPatient = (patient) => {
        setSelectedPatient(patient);
        setShowAddModal(true);
    };

    const handleDeletePatient = async (patientId) => {
        if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        // Set loading state for the specific patient
        setPatients(patients.map(p =>
            p.id === patientId
                ? { ...p, deleting: true }
                : p
        ));

        try {
            await apiClient.deletePatient(patientId);
            // Remove the patient from the list
            setPatients(patients.filter(p => p.id !== patientId));
            setError(''); // Clear any previous errors

            // Optionally show success message
            console.log('Patient deleted successfully');
        } catch (err) {
            // Remove the deleting state on error
            setPatients(patients.map(p =>
                p.id === patientId
                    ? { ...p, deleting: false }
                    : p
            ));

            const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete patient';
            setError(`Failed to delete patient: ${errorMessage}`);
            console.error('Delete patient error:', err);
        }
    };

    const handleAddPatient = () => {
        setSelectedPatient(null);
        setShowAddModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:flex sm:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage ANC patients and their appointments
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={handleAddPatient}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Patient
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, ANC number, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                        Showing {currentPatients.length} of {filteredPatients.length} patients
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {error}
                    </div>
                </div>
            )}

            {/* Patients Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pregnancy Weeks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registration Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preferred Hospitals
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentPatients.length > 0 ? (
                                currentPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-teal-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {patient.name || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {patient.phone || 'No phone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                                <div>
                                                    <div className="font-medium">{patient.ward || '-'}</div>
                                                    <div className="text-gray-500">{patient.county || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {patient.weeks_pregnant || 0} weeks
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(patient.date_registered)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="max-w-xs">
                                                {patient.preferred_hospitals?.length > 0 ? (
                                                    <div className="text-xs">
                                                        {patient.preferred_hospitals.slice(0, 2).map((hospital, idx) => (
                                                            <span key={idx} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full mr-1 mb-1">
                                                                {hospital.name || `Hospital ${hospital}`}
                                                            </span>
                                                        ))}
                                                        {patient.preferred_hospitals.length > 2 && (
                                                            <span className="text-gray-500">+{patient.preferred_hospitals.length - 2} more</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No preferences</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewPatient(patient)}
                                                    className="text-teal-600 hover:text-teal-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditPatient(patient)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Edit Patient"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePatient(patient.id)}
                                                    disabled={patient.deleting}
                                                    className={`${patient.deleting
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-red-600 hover:text-red-900'
                                                        }`}
                                                    title={patient.deleting ? "Deleting..." : "Delete Patient"}
                                                >
                                                    {patient.deleting ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <User className="h-12 w-12 text-gray-300 mb-4" />
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                                {searchTerm || filterStatus !== 'all'
                                                    ? 'No patients found'
                                                    : 'No patients registered yet'}
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-4">
                                                {searchTerm || filterStatus !== 'all'
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : 'Get started by adding your first patient'}
                                            </p>
                                            {!searchTerm && filterStatus === 'all' && (
                                                <button
                                                    onClick={handleAddPatient}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add First Patient
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">{indexOfFirstPatient + 1}</span>
                                {' '}to{' '}
                                <span className="font-medium">
                                    {Math.min(indexOfLastPatient, filteredPatients.length)}
                                </span>
                                {' '}of{' '}
                                <span className="font-medium">{filteredPatients.length}</span>
                                {' '}results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Patient Modal */}
            {showAddModal && (
                <AddEditPatientModal
                    patient={selectedPatient}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedPatient(null);
                    }}
                    onSave={async (patientData) => {
                        try {
                            if (selectedPatient) {
                                // Edit existing patient
                                await apiClient.updatePatient(selectedPatient.id, patientData);
                                setPatients(patients.map(p =>
                                    p.id === selectedPatient.id
                                        ? { ...p, ...patientData }
                                        : p
                                ));
                            } else {
                                // Create new patient
                                const newPatient = await apiClient.createPatient(patientData);
                                setPatients([newPatient, ...patients]);
                            }
                            setShowAddModal(false);
                            setSelectedPatient(null);
                        } catch (err) {
                            setError(err.message || 'Failed to save patient');
                        }
                    }}
                />
            )}

            {/* Patient Details Modal */}
            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Patient Details</h3>
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><strong>Name:</strong> {selectedPatient.name || 'Not provided'}</p>
                                        <p><strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}</p>
                                        <p><strong>Registration Date:</strong> {formatDate(selectedPatient.date_registered)}</p>
                                        <p><strong>Emergency Contact:</strong> {selectedPatient.emergency_contact || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Location & Medical Information</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><strong>Ward:</strong> {selectedPatient.ward || 'Not specified'}</p>
                                        <p><strong>County:</strong> {selectedPatient.county || 'Not specified'}</p>
                                        <p><strong>Pregnancy Weeks:</strong> {selectedPatient.weeks_pregnant || 0} weeks</p>
                                        <p><strong>Suggested Hospitals:</strong>
                                            <span className="block mt-1">
                                                {selectedPatient.suggested_hospitals?.length > 0 ? (
                                                    selectedPatient.suggested_hospitals.map((hospital, idx) => (
                                                        <span key={idx} className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded-full mr-1 mb-1 text-xs">
                                                            {hospital.name || `Hospital ${hospital}`}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">No suggestions yet</span>
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPatientModal(false);
                                        handleEditPatient(selectedPatient);
                                    }}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700"
                                >
                                    Edit Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add/Edit Patient Modal Component
const AddEditPatientModal = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        weeks_pregnant: '',
        ward: '',
        county: '',
        emergency_contact: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (patient) {
            setFormData({
                name: patient.name || '',
                phone: patient.phone || '',
                weeks_pregnant: patient.weeks_pregnant || '',
                ward: patient.ward || '',
                county: patient.county || '',
                emergency_contact: patient.emergency_contact || ''
            });
        }
    }, [patient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSave(formData);
        } catch (err) {
            setError(err.message || 'Failed to save patient');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">
                            {patient ? 'Edit Patient' : 'Add New Patient'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Patient Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter patient name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pregnancy Weeks
                                </label>
                                <input
                                    type="number"
                                    name="weeks_pregnant"
                                    value={formData.weeks_pregnant}
                                    onChange={handleChange}
                                    min="0"
                                    max="42"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter pregnancy weeks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ward
                                </label>
                                <input
                                    type="text"
                                    name="ward"
                                    value={formData.ward}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter ward"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    County
                                </label>
                                <input
                                    type="text"
                                    name="county"
                                    value={formData.county}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter county"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emergency Contact
                                </label>
                                <input
                                    type="tel"
                                    name="emergency_contact"
                                    value={formData.emergency_contact}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter emergency contact"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (patient ? 'Update Patient' : 'Add Patient')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientManagement;