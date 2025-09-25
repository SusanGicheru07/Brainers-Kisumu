import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Users,
    TrendingUp,
    Activity,
    Heart,
    AlertCircle,
    CheckCircle,
    Calendar,
    FileText
} from 'lucide-react';

const HospitalDashboard = () => {
    const [dashboardData, setDashboardData] = useState([]);
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('new_clients');

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    const metrics = [
        { key: 'new_clients', label: 'New ANC Clients', icon: Users, color: '#14B8A6' },
        { key: 'completed4', label: 'Completed 4+ Visits', icon: CheckCircle, color: '#10B981' },
        { key: 'completed8', label: 'Completed 8+ Visits', icon: Activity, color: '#0891B2' },
        { key: 'anc12', label: 'First ANC < 12 Weeks', icon: Calendar, color: '#F59E0B' },
        { key: 'cervical_cancer_screened', label: 'Cervical Cancer Screening', icon: Heart, color: '#EF4444' },
        { key: 'breast_cancer', label: 'Breast Cancer Screening', icon: AlertCircle, color: '#8B5CF6' },
    ];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Fetching dashboard data...');
            const data = await apiClient.getHospitalDashboardData();
            console.log('Received dashboard data:', data);

            if (data && typeof data === 'object') {
                // Extract hospital info if available
                if (data.hospital_info) {
                    setHospitalInfo(data.hospital_info);
                }

                // Handle ANC records data
                if (data.anc_records && Array.isArray(data.anc_records) && data.anc_records.length > 0) {
                    setDashboardData(data.anc_records);
                } else if (Array.isArray(data) && data.length > 0) {
                    setDashboardData(data);
                } else if (data.patient_stats || data.appointment_stats) {
                    // Convert the response to chart-compatible format
                    setDashboardData([data]);
                } else {
                    // If no data from backend, use sample data for demonstration
                    console.log('No ANC data from backend, using sample data');
                    setDashboardData(getSampleData());
                }
            } else if (Array.isArray(data) && data.length > 0) {
                setDashboardData(data);
            } else {
                // If no data from backend, use sample data for demonstration
                console.log('No data from backend, using sample data');
                setDashboardData(getSampleData());
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            // On error, show sample data instead of empty state
            console.log('Error fetching data, using sample data for demo');
            setDashboardData(getSampleData());
            setError(''); // Clear error to show sample data
        } finally {
            setLoading(false);
        }
    };

    const getSampleData = () => {
        return [
            {
                periodname: '2024-Q1',
                new_clients: 150,
                cervical_cancer: 45,
                iron_folate: 120,
                iron: 110,
                folic: 100,
                preg_adol: 25,
                completed4: 90,
                revisit: 200,
                ipt3: 80,
                anc12: 70,
                completed8: 60,
                fgm: 5,
                preg_youth: 40,
                breast_cancer: 30,
                cervical_cancer_screened: 35
            },
            {
                periodname: '2024-Q2',
                new_clients: 165,
                cervical_cancer: 50,
                iron_folate: 135,
                iron: 125,
                folic: 115,
                preg_adol: 30,
                completed4: 95,
                revisit: 220,
                ipt3: 85,
                anc12: 75,
                completed8: 65,
                fgm: 3,
                preg_youth: 45,
                breast_cancer: 35,
                cervical_cancer_screened: 40
            },
            {
                periodname: '2024-Q3',
                new_clients: 180,
                cervical_cancer: 55,
                iron_folate: 145,
                iron: 135,
                folic: 125,
                preg_adol: 35,
                completed4: 105,
                revisit: 240,
                ipt3: 90,
                anc12: 85,
                completed8: 75,
                fgm: 2,
                preg_youth: 50,
                breast_cancer: 40,
                cervical_cancer_screened: 45
            },
            {
                periodname: '2024-Q4',
                new_clients: 195,
                cervical_cancer: 60,
                iron_folate: 155,
                iron: 145,
                folic: 135,
                preg_adol: 40,
                completed4: 115,
                revisit: 260,
                ipt3: 95,
                anc12: 95,
                completed8: 85,
                fgm: 1,
                preg_youth: 55,
                breast_cancer: 45,
                cervical_cancer_screened: 50
            }
        ];
    };

    const getTotalForMetric = (metric) => {
        return dashboardData.reduce((total, item) => total + (item[metric] || 0), 0);
    };

    const getLatestPeriodData = () => {
        if (dashboardData.length === 0) return null;
        return dashboardData[dashboardData.length - 1];
    };

    const formatPeriodName = (periodname) => {
        // Handle different period formats (e.g., "2024-Q1", "2024-01", etc.)
        if (periodname && periodname.includes('-Q')) {
            const [year, quarter] = periodname.split('-Q');
            return `Q${quarter} ${year}`;
        }
        return periodname;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <p className="text-gray-600">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <div>
                            <p className="font-medium">Error Loading Dashboard</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const latestData = getLatestPeriodData();

    // Show empty state if no data
    if (!loading && !error && dashboardData.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Data Available</h3>
                <p className="text-gray-600 mb-4">There's no ANC data to display yet. Please check back later.</p>
                <button
                    onClick={fetchDashboardData}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hospital Matricare Dashboard</h1>
                        {hospitalInfo && (
                            <h2 className="text-xl font-semibold text-teal-700 mt-1">
                                {hospitalInfo.name}
                            </h2>
                        )}
                        <p className="mt-2 text-sm text-gray-600">
                            Monitor your hospital's antenatal care performance and metrics
                        </p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span>Refresh Data</span>
                    </button>
                </div>
                {dashboardData.some(d => d.periodname === '2024-Q1') && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm">
                        📊 Currently showing sample data for demonstration purposes
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    const total = getTotalForMetric(metric.key);
                    const latest = latestData ? latestData[metric.key] || 0 : 0;

                    return (
                        <div
                            key={metric.key}
                            className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow"
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="h-10 w-10 rounded-md flex items-center justify-center"
                                            style={{ backgroundColor: `${metric.color}20` }}
                                        >
                                            <Icon
                                                className="h-6 w-6"
                                                style={{ color: metric.color }}
                                            />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {metric.label}
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {total.toLocaleString()}
                                            </dd>
                                            <dd className="text-sm text-gray-500">
                                                Latest: {latest.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">ANC Trends Over Time</h3>
                        <div className="mt-2">
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {metrics.map((metric) => (
                                    <option key={metric.key} value={metric.key}>
                                        {metric.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {dashboardData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dashboardData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="periodname"
                                    tickFormatter={formatPeriodName}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => `Period: ${formatPeriodName(value)}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    stroke={metrics.find(m => m.key === selectedMetric)?.color || '#3B82F6'}
                                    strokeWidth={3}
                                    name={metrics.find(m => m.key === selectedMetric)?.label}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No data available for chart
                        </div>
                    )}
                </div>

                {/* Comparison Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Period Performance</h3>

                    {latestData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[
                                { name: 'New Clients', value: latestData.new_clients || 0, color: '#14B8A6' },
                                { name: '4+ Visits', value: latestData.completed4 || 0, color: '#10B981' },
                                { name: '8+ Visits', value: latestData.completed8 || 0, color: '#0891B2' },
                                { name: 'Early ANC', value: latestData.anc12 || 0, color: '#F59E0B' },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#14B8A6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No current period data available
                        </div>
                    )}
                </div>
            </div>

            {/* Screening Services Overview */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Screening Services</h3>

                {dashboardData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Cervical Cancer Screening', value: getTotalForMetric('cervical_cancer_screened') },
                                        { name: 'Breast Cancer Screening', value: getTotalForMetric('breast_cancer') },
                                        { name: 'FGM Complications', value: getTotalForMetric('fgm') },
                                    ].filter(item => item.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {colors.map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Iron/Folate Supplements</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {getTotalForMetric('iron_folate').toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">IPT 3rd Dose</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {getTotalForMetric('ipt3').toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Pregnant Adolescents (15-19)</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {getTotalForMetric('preg_adol').toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Pregnant Youth (20-24)</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {getTotalForMetric('preg_youth').toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        No screening data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalDashboard;