import React, { useState, useEffect } from 'react';
import api, { isAuthenticated } from '../utils/api';

// Simple icon components as fallbacks
const CalendarDaysIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>📅</div>
);
const UsersIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>👥</div>
);
const ClipboardDocumentCheckIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>📋</div>
);
const ExclamationTriangleIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>⚠️</div>
);
const InformationCircleIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>ℹ️</div>
);
const ChartBarIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>📊</div>
);
const CheckCircleIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>✅</div>
);
const XMarkIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>❌</div>
);
const ClockIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>🕐</div>
);
const HeartIcon = ({ className }) => (
    <div className={`${className} flex items-center justify-center text-2xl`}>❤️</div>
);

const WeeklyVisits = () => {
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showANCInfo, setShowANCInfo] = useState(false);



    const fetchWeeklyData = async () => {
        try {
            setLoading(true);

            // Debug: Check authentication status
            console.log('Authentication check:');
            console.log('- localStorage user:', localStorage.getItem('user'));
            console.log('- localStorage sessionId:', localStorage.getItem('sessionId'));
            console.log('- isAuthenticated():', isAuthenticated());

            // Test: Try a simpler authenticated endpoint first
            try {
                console.log('Testing basic authentication with hospital dashboard...');
                const testResponse = await api.getHospitalDashboardData();
                console.log('Hospital dashboard test successful:', testResponse);
            } catch (testError) {
                console.error('Hospital dashboard test failed:', testError);
                if (testError.message.includes('403')) {
                    setError('Authentication failed. Please log out and log in again.');
                    return;
                }
            }

            const response = await api.getWeeklyPatientVisits();
            setWeeklyData(response);
        } catch (error) {
            console.error('Error fetching weekly data:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            });
            setError('Failed to load weekly visit data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeeklyData();
    }, []);

    const StatusCard = ({ title, value, icon: Icon, color, description }) => (
        <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                <Icon className="h-12 w-12 text-gray-400" />
            </div>
        </div>
    );

    const DayCard = ({ day }) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'completed': return 'text-green-600 bg-green-100';
                case 'scheduled': return 'text-blue-600 bg-blue-100';
                case 'missed': return 'text-red-600 bg-red-100';
                case 'cancelled': return 'text-gray-600 bg-gray-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        };

        return (
            <div className="bg-white rounded-lg shadow-md p-4 border">
                <div className="text-center">
                    <h3 className="font-semibold text-gray-900">{day.day_name}</h3>
                    <p className="text-sm text-gray-500">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{day.total_appointments}</p>
                    <p className="text-xs text-gray-500">Total Appointments</p>
                </div>

                <div className="mt-4 space-y-2">
                    {day.scheduled > 0 && (
                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor('scheduled')}`}>
                                Scheduled
                            </span>
                            <span className="text-sm font-medium">{day.scheduled}</span>
                        </div>
                    )}
                    {day.completed > 0 && (
                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor('completed')}`}>
                                Completed
                            </span>
                            <span className="text-sm font-medium">{day.completed}</span>
                        </div>
                    )}
                    {day.missed > 0 && (
                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor('missed')}`}>
                                Missed
                            </span>
                            <span className="text-sm font-medium">{day.missed}</span>
                        </div>
                    )}
                    {day.cancelled > 0 && (
                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor('cancelled')}`}>
                                Cancelled
                            </span>
                            <span className="text-sm font-medium">{day.cancelled}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ANCInfoModal = () => (
        showANCInfo && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <HeartIcon className="h-6 w-6 text-red-500 mr-2" />
                                {weeklyData?.anc_information?.title}
                            </h3>
                            <button
                                onClick={() => setShowANCInfo(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            <p className="text-gray-600 mb-4">{weeklyData?.anc_information?.description}</p>

                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Recommended Visit Schedule</h4>
                                <div className="grid gap-2">
                                    {weeklyData?.anc_information?.recommended_visits?.map((visit, index) => (
                                        <div key={index} className="flex items-start space-x-3 p-2 bg-blue-50 rounded">
                                            <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-bold min-w-max">
                                                Week {visit.week}
                                            </span>
                                            <p className="text-sm text-gray-700">{visit.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Key Services Provided</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {weeklyData?.anc_information?.key_services?.map((service, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-gray-700">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                                    Warning Signs - Seek Immediate Care
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {weeklyData?.anc_information?.warning_signs?.map((sign, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                            <span className="text-sm text-gray-700">{sign}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchWeeklyData}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const data = weeklyData;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Weekly Patient Visits</h1>
                    <p className="text-gray-600 mt-1">
                        {data?.hospital_info?.name} - Week {data?.week_period?.week_number}, {data?.week_period?.year}
                    </p>
                    <p className="text-sm text-gray-500">
                        {new Date(data?.week_period?.start_date).toLocaleDateString()} - {new Date(data?.week_period?.end_date).toLocaleDateString()}
                    </p>
                </div>
                <button
                    onClick={() => setShowANCInfo(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                    <InformationCircleIcon className="h-5 w-5" />
                    <span>ANC Guidelines</span>
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatusCard
                    title="Total Appointments"
                    value={data?.appointments_summary?.total_appointments || 0}
                    icon={CalendarDaysIcon}
                    color="border-blue-500"
                    description="This week"
                />
                <StatusCard
                    title="Completion Rate"
                    value={`${data?.dashboard_metrics?.completion_rate || 0}%`}
                    icon={CheckCircleIcon}
                    color="border-green-500"
                    description="Appointments completed"
                />
                <StatusCard
                    title="Capacity Utilization"
                    value={`${data?.capacity_info?.utilization_percentage || 0}%`}
                    icon={ChartBarIcon}
                    color="border-yellow-500"
                    description={`${data?.capacity_info?.available_slots || 0} slots available`}
                />
                <StatusCard
                    title="Patients Needing Visit"
                    value={data?.patients_summary?.should_visit || 0}
                    icon={ExclamationTriangleIcon}
                    color="border-red-500"
                    description="Require attention"
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-green-600">Completed</span>
                            <span className="font-bold">{data?.appointments_summary?.by_status?.completed || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-600">Scheduled</span>
                            <span className="font-bold">{data?.appointments_summary?.by_status?.scheduled || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-red-600">Missed</span>
                            <span className="font-bold">{data?.appointments_summary?.by_status?.missed || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cancelled</span>
                            <span className="font-bold">{data?.appointments_summary?.by_status?.cancelled || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Rates</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-green-600">Completion Rate</span>
                            <span className="font-bold">{data?.dashboard_metrics?.completion_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-red-600">No-Show Rate</span>
                            <span className="font-bold">{data?.dashboard_metrics?.no_show_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cancellation Rate</span>
                            <span className="font-bold">{data?.dashboard_metrics?.cancellation_rate || 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Info</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-600">Daily Capacity</span>
                            <span className="font-bold">{data?.capacity_info?.daily_capacity || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-orange-600">Current Load</span>
                            <span className="font-bold">{data?.capacity_info?.current_capacity || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-green-600">Available Slots</span>
                            <span className="font-bold">{data?.capacity_info?.available_slots || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Appointments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                    {data?.appointments_summary?.by_day?.map((day, index) => (
                        <DayCard key={index} day={day} />
                    ))}
                </div>
            </div>

            {/* Patient Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Status Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">{data?.patients_summary?.good || 0}</p>
                        <p className="text-sm text-green-600">Patients in Good Status</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <ClockIcon className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">{data?.patients_summary?.should_visit || 0}</p>
                        <p className="text-sm text-yellow-600">Patients Should Visit</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <UsersIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{data?.patients_summary?.total_patients || 0}</p>
                        <p className="text-sm text-blue-600">Total Unique Patients</p>
                    </div>
                </div>
            </div>

            {/* ANC Information Modal */}
            <ANCInfoModal />
        </div>
    );
};

export default WeeklyVisits;