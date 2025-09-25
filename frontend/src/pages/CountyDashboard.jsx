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
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import {
    MapPin,
    TrendingUp,
    Users,
    Award,
    AlertCircle,
    Building2,
    BarChart3,
    Target,
    Trophy,
    FileText,
    Activity,
    Heart,
    CheckCircle
} from 'lucide-react';

const CountyDashboard = () => {
    const [countyData, setCountyData] = useState([]);
    const [countyInfo, setCountyInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('new_clients');

    const metrics = [
        { key: 'new_clients', label: 'New ANC Clients', color: '#14B8A6', icon: Users },
        { key: 'completed4', label: 'Completed 4+ Visits', color: '#10B981', icon: CheckCircle },
        { key: 'completed8', label: 'Completed 8+ Visits', color: '#0891B2', icon: Activity },
        { key: 'anc12', label: 'First ANC < 12 Weeks', color: '#F59E0B', icon: Target },
        { key: 'cervical_cancer_screened', label: 'Cervical Cancer Screening', color: '#EF4444', icon: Heart },
        { key: 'breast_cancer', label: 'Breast Cancer Screening', color: '#8B5CF6', icon: AlertCircle },
    ];

    useEffect(() => {
        fetchCountyData();
    }, []);

    const fetchCountyData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Fetching county dashboard data...');
            const data = await apiClient.getCountyDashboardData();
            console.log('Received county data:', data);

            if (data && typeof data === 'object') {
                // Extract county info if available
                if (data.county_info) {
                    setCountyInfo(data.county_info);
                }

                // Extract hospitals data
                if (data.hospitals_data && Array.isArray(data.hospitals_data) && data.hospitals_data.length > 0) {
                    setCountyData(data.hospitals_data);
                } else if (Array.isArray(data) && data.length > 0) {
                    setCountyData(data);
                } else {
                    // Use sample county data for demonstration
                    console.log('No data from backend, using sample county data');
                    setCountyData(getSampleCountyData());
                }
            } else if (Array.isArray(data) && data.length > 0) {
                setCountyData(data);
            } else {
                // Use sample county data for demonstration
                console.log('No data from backend, using sample county data');
                setCountyData(getSampleCountyData());
            }
        } catch (err) {
            console.error('County dashboard fetch error:', err);
            // On error, show sample data instead of empty state
            console.log('Error fetching county data, using sample data for demo');
            setCountyData(getSampleCountyData());
            setError('');
        } finally {
            setLoading(false);
        }
    };

    const getSampleCountyData = () => {
        return [
            {
                hospital_name: 'Kisumu County Referral Hospital',
                county: 'Kisumu',
                sub_county: 'Kisumu Central',
                new_clients: 195,
                completed4: 115,
                completed8: 85,
                anc12: 95,
                cervical_cancer_screened: 50,
                breast_cancer: 45,
                iron_folate: 155,
                revisit: 260,
                ipt3: 95,
                isCurrentHospital: true
            },
            {
                hospital_name: 'Jaramogi Oginga Odinga Teaching Hospital',
                county: 'Kisumu',
                sub_county: 'Kisumu West',
                new_clients: 220,
                completed4: 130,
                completed8: 95,
                anc12: 105,
                cervical_cancer_screened: 55,
                breast_cancer: 50,
                iron_folate: 175,
                revisit: 290,
                ipt3: 105
            },
            {
                hospital_name: 'Ahero Sub-County Hospital',
                county: 'Kisumu',
                sub_county: 'Nyando',
                new_clients: 160,
                completed4: 90,
                completed8: 65,
                anc12: 75,
                cervical_cancer_screened: 40,
                breast_cancer: 35,
                iron_folate: 125,
                revisit: 210,
                ipt3: 75
            },
            {
                hospital_name: 'Katito Health Center',
                county: 'Kisumu',
                sub_county: 'Nyando',
                new_clients: 140,
                completed4: 80,
                completed8: 55,
                anc12: 65,
                cervical_cancer_screened: 35,
                breast_cancer: 30,
                iron_folate: 110,
                revisit: 185,
                ipt3: 65
            },
            {
                hospital_name: 'Muhoroni District Hospital',
                county: 'Kisumu',
                sub_county: 'Muhoroni',
                new_clients: 180,
                completed4: 105,
                completed8: 75,
                anc12: 85,
                cervical_cancer_screened: 45,
                breast_cancer: 40,
                iron_folate: 145,
                revisit: 240,
                ipt3: 85
            },
            {
                hospital_name: 'Nyakach District Hospital',
                county: 'Kisumu',
                sub_county: 'Nyakach',
                new_clients: 125,
                completed4: 70,
                completed8: 50,
                anc12: 60,
                cervical_cancer_screened: 30,
                breast_cancer: 25,
                iron_folate: 95,
                revisit: 165,
                ipt3: 55
            }
        ];
    };

    const getRankings = () => {
        if (!countyData.length) return [];

        const sorted = [...countyData].sort((a, b) => (b[selectedMetric] || 0) - (a[selectedMetric] || 0));
        return sorted.map((hospital, index) => ({
            ...hospital,
            rank: index + 1
        }));
    };

    const getCurrentHospitalRank = () => {
        const rankings = getRankings();
        const currentHospital = rankings.find(h => h.isCurrentHospital);
        return currentHospital ? currentHospital.rank : null;
    };

    const getPerformanceCategory = (value, average) => {
        const ratio = value / average;
        if (ratio >= 1.2) return { category: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
        if (ratio >= 1.0) return { category: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
        if (ratio >= 0.8) return { category: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
        return { category: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
    };

    const getTopPerformers = () => {
        if (!countyData.length) return [];
        const rankings = getRankings();
        return rankings.slice(0, 3);
    };

    const getRadarChartData = () => {
        const currentHospital = countyData.find(h => h.isCurrentHospital);
        if (!currentHospital) return [];

        return [
            {
                metric: 'New Clients',
                hospital: currentHospital.new_clients || 0,
                average: getAverageMetric('new_clients'),
                fullMark: Math.max(...countyData.map(h => h.new_clients || 0))
            },
            {
                metric: '4+ Visits',
                hospital: currentHospital.completed4 || 0,
                average: getAverageMetric('completed4'),
                fullMark: Math.max(...countyData.map(h => h.completed4 || 0))
            },
            {
                metric: '8+ Visits',
                hospital: currentHospital.completed8 || 0,
                average: getAverageMetric('completed8'),
                fullMark: Math.max(...countyData.map(h => h.completed8 || 0))
            },
            {
                metric: 'Early ANC',
                hospital: currentHospital.anc12 || 0,
                average: getAverageMetric('anc12'),
                fullMark: Math.max(...countyData.map(h => h.anc12 || 0))
            },
            {
                metric: 'Cervical Screen',
                hospital: currentHospital.cervical_cancer_screened || 0,
                average: getAverageMetric('cervical_cancer_screened'),
                fullMark: Math.max(...countyData.map(h => h.cervical_cancer_screened || 0))
            }
        ];
    };

    const getTotalCountyMetric = (metric) => {
        return countyData.reduce((total, hospital) => total + (hospital[metric] || 0), 0);
    };

    const getAverageMetric = (metric) => {
        if (!countyData.length) return 0;
        return Math.round(getTotalCountyMetric(metric) / countyData.length);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <p className="text-gray-600">Loading county dashboard data...</p>
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
                            <p className="font-medium">Error Loading County Dashboard</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchCountyData}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Show empty state if no data
    if (!loading && !error && countyData.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No County Data Available</h3>
                <p className="text-gray-600 mb-4">There's no county ANC data to display yet. Please check back later.</p>
                <button
                    onClick={fetchCountyData}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    const rankings = getRankings();
    const currentRank = getCurrentHospitalRank();

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">County ANC Dashboard</h1>
                        {countyInfo && (
                            <div className="mt-1">
                                <h2 className="text-xl font-semibold text-teal-700">
                                    {countyInfo.county} County
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Viewing from: {countyInfo.user_hospital}
                                </p>
                            </div>
                        )}
                        <p className="mt-2 text-sm text-gray-600">
                            Compare hospital performance and track county-wide ANC metrics
                        </p>
                    </div>
                    <button
                        onClick={fetchCountyData}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span>Refresh County Data</span>
                    </button>
                </div>
                {countyData.some(d => d.hospital_name === 'Kisumu County Referral Hospital') && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm">
                        📊 Currently showing sample county data for demonstration purposes
                    </div>
                )}
            </div>

            {/* County Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-md bg-teal-100 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-teal-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Hospitals in County
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {countyData.length}
                                    </dd>
                                    <dd className="text-sm text-gray-600">
                                        Across {new Set(countyData.map(h => h.sub_county)).size} sub-counties
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total County ANC Clients
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {getTotalCountyMetric('new_clients').toLocaleString()}
                                    </dd>
                                    <dd className="text-sm text-gray-600">
                                        Avg: {getAverageMetric('new_clients')} per hospital
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        4+ Visits Completion
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {Math.round((getTotalCountyMetric('completed4') / getTotalCountyMetric('new_clients')) * 100)}%
                                    </dd>
                                    <dd className="text-sm text-gray-600">
                                        {getTotalCountyMetric('completed4').toLocaleString()} clients
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {currentRank && (
                    <div className="bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center">
                                        <Trophy className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Your Hospital Rank
                                        </dt>
                                        <dd className="text-lg font-semibold text-gray-900">
                                            #{currentRank} of {countyData.length}
                                        </dd>
                                        <dd className="text-sm text-gray-600">
                                            In {metrics.find(m => m.key === selectedMetric)?.label}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Metric Selection & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Metric Selection */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compare hospitals by:
                    </label>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    >
                        {metrics.map((metric) => (
                            <option key={metric.key} value={metric.key}>
                                {metric.label}
                            </option>
                        ))}
                    </select>
                    <div className="mt-4 p-3 bg-teal-50 rounded-md">
                        <p className="text-sm text-teal-700">
                            <span className="font-medium">County Average:</span> {getAverageMetric(selectedMetric).toLocaleString()}
                        </p>
                        <p className="text-sm text-teal-700 mt-1">
                            <span className="font-medium">Total County:</span> {getTotalCountyMetric(selectedMetric).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Trophy className="h-5 w-5 text-teal-600 mr-2" />
                        Top Performing Hospitals
                    </h3>
                    <div className="space-y-3">
                        {getTopPerformers().map((hospital, index) => (
                            <div
                                key={hospital.hospital_name}
                                className={`flex items-center justify-between p-3 rounded-lg border ${hospital.isCurrentHospital ? 'bg-teal-50 border-teal-200' : 'bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                        index === 1 ? 'bg-gray-100 text-gray-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                        <span className="text-sm font-bold">#{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {hospital.hospital_name}
                                            {hospital.isCurrentHospital && (
                                                <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                                                    Your Hospital
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-600">{hospital.sub_county}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        {(hospital[selectedMetric] || 0).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {Math.round(((hospital[selectedMetric] || 0) / getAverageMetric(selectedMetric)) * 100)}% of avg
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Hospital Comparison Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 text-teal-600 mr-2" />
                        Hospital Comparison: {metrics.find(m => m.key === selectedMetric)?.label}
                    </h3>

                    {countyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={rankings}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="hospital_name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => `Hospital: ${value}`}
                                    formatter={(value) => [value.toLocaleString(), metrics.find(m => m.key === selectedMetric)?.label]}
                                />
                                <Bar
                                    dataKey={selectedMetric}
                                    fill={metrics.find(m => m.key === selectedMetric)?.color || '#14B8A6'}
                                    name={metrics.find(m => m.key === selectedMetric)?.label}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No data available for comparison
                        </div>
                    )}
                </div>

                {/* Performance Radar Chart */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="h-5 w-5 text-teal-600 mr-2" />
                        Your Hospital vs County Average
                    </h3>

                    {getRadarChartData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={getRadarChartData()}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} />
                                <Radar
                                    name="Your Hospital"
                                    dataKey="hospital"
                                    stroke="#14B8A6"
                                    fill="#14B8A6"
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                />
                                <Radar
                                    name="County Average"
                                    dataKey="average"
                                    stroke="#6B7280"
                                    fill="#6B7280"
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No hospital data available for radar chart
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-County Analysis */}
            <div className="bg-white p-6 rounded-lg shadow border mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 text-teal-600 mr-2" />
                    Performance by Sub-County
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Array.from(new Set(countyData.map(h => h.sub_county))).map(subCounty => {
                        const subCountyHospitals = countyData.filter(h => h.sub_county === subCounty);
                        const totalMetric = subCountyHospitals.reduce((sum, h) => sum + (h[selectedMetric] || 0), 0);
                        const avgMetric = Math.round(totalMetric / subCountyHospitals.length);

                        return (
                            <div key={subCounty} className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="font-medium text-gray-900 mb-2">{subCounty}</h4>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Hospitals:</span> {subCountyHospitals.length}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Total:</span> {totalMetric.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Average:</span> {avgMetric.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {countyData.length > 0 && (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={Array.from(new Set(countyData.map(h => h.sub_county))).map(subCounty => {
                                const hospitals = countyData.filter(h => h.sub_county === subCounty);
                                return {
                                    name: subCounty,
                                    hospitals: hospitals.length,
                                    total: hospitals.reduce((sum, h) => sum + (h[selectedMetric] || 0), 0),
                                    average: Math.round(hospitals.reduce((sum, h) => sum + (h[selectedMetric] || 0), 0) / hospitals.length)
                                };
                            })}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value, name) => [
                                    value.toLocaleString(),
                                    name === 'total' ? 'Total' : name === 'average' ? 'Average' : 'Hospitals'
                                ]}
                            />
                            <Bar dataKey="total" fill="#14B8A6" name="Total" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Detailed Rankings Table */}
            <div className="bg-white shadow rounded-lg border">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Detailed Hospital Rankings
                    </h3>
                    <p className="text-sm text-gray-600">
                        Complete performance comparison across all metrics
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hospital
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sub-County
                                </th>
                                {metrics.map(metric => (
                                    <th key={metric.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {metric.label}
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rankings.map((hospital, index) => {
                                const performance = getPerformanceCategory(
                                    hospital[selectedMetric] || 0,
                                    getAverageMetric(selectedMetric)
                                );

                                return (
                                    <tr key={hospital.hospital_name} className={hospital.isCurrentHospital ? 'bg-teal-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                                #{hospital.rank}
                                                {index < 3 && (
                                                    <Trophy className={`h-4 w-4 ml-2 ${index === 0 ? 'text-yellow-500' :
                                                        index === 1 ? 'text-gray-400' :
                                                            'text-orange-400'
                                                        }`} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {hospital.hospital_name}
                                                {hospital.isCurrentHospital && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                                        Your Hospital
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {hospital.sub_county}
                                        </td>
                                        {metrics.map(metric => (
                                            <td key={metric.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className={selectedMetric === metric.key ? 'font-bold text-teal-600' : ''}>
                                                    {(hospital[metric.key] || 0).toLocaleString()}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${performance.bgColor} ${performance.color}`}>
                                                {performance.category}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Insights */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 text-teal-600 mr-2" />
                        Key Performance Insights
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Highest Performing Hospital:</span>
                            <span className="font-medium text-gray-900">
                                {rankings[0]?.hospital_name || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">County ANC Completion Rate:</span>
                            <span className="font-medium text-gray-900">
                                {Math.round((getTotalCountyMetric('completed4') / getTotalCountyMetric('new_clients')) * 100)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Early ANC Rate:</span>
                            <span className="font-medium text-gray-900">
                                {Math.round((getTotalCountyMetric('anc12') / getTotalCountyMetric('new_clients')) * 100)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Screening Coverage:</span>
                            <span className="font-medium text-gray-900">
                                {Math.round((getTotalCountyMetric('cervical_cancer_screened') / getTotalCountyMetric('new_clients')) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="h-5 w-5 text-teal-600 mr-2" />
                        County Goals & Targets
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Target ANC4 Coverage:</span>
                            <span className="font-medium text-teal-600">80%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Achievement:</span>
                            <span className={`font-medium ${Math.round((getTotalCountyMetric('completed4') / getTotalCountyMetric('new_clients')) * 100) >= 80
                                ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                {Math.round((getTotalCountyMetric('completed4') / getTotalCountyMetric('new_clients')) * 100)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Progress to Goal:</span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-teal-600 h-2 rounded-full"
                                    style={{
                                        width: `${Math.min(Math.round((getTotalCountyMetric('completed4') / getTotalCountyMetric('new_clients')) * 100) / 80 * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Keep improving to reach county-wide ANC coverage targets
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountyDashboard;