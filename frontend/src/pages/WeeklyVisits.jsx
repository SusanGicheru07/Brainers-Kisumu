import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import {
    Calendar,
    TrendingUp,
    Users,
    Clock,
    AlertTriangle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

const WeeklyVisits = () => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedWeeks, setSelectedWeeks] = useState(12); // Show last 12 weeks by default

    const weekOptions = [
        { value: 4, label: 'Last 4 Weeks' },
        { value: 8, label: 'Last 8 Weeks' },
        { value: 12, label: 'Last 12 Weeks' },
        { value: 24, label: 'Last 24 Weeks' },
        { value: 52, label: 'Last 52 Weeks' },
    ];

    useEffect(() => {
        fetchWeeklyData();
    }, []);

    const fetchWeeklyData = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getWeeklyPatientVisits();
            setWeeklyData(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch weekly visits data');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        return weeklyData.slice(-selectedWeeks);
    };

    const calculateStats = () => {
        const filteredData = getFilteredData();
        if (filteredData.length === 0) return {};

        const totalVisits = filteredData.reduce((sum, week) => sum + (week.total_visits || 0), 0);
        const avgVisitsPerWeek = Math.round(totalVisits / filteredData.length);

        // Calculate trend (comparing first half with second half)
        const midpoint = Math.floor(filteredData.length / 2);
        const firstHalf = filteredData.slice(0, midpoint);
        const secondHalf = filteredData.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((sum, week) => sum + (week.total_visits || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, week) => sum + (week.total_visits || 0), 0) / secondHalf.length;

        const trend = secondHalfAvg - firstHalfAvg;
        const trendPercentage = firstHalfAvg > 0 ? ((trend / firstHalfAvg) * 100).toFixed(1) : 0;

        // Find peak week
        const peakWeek = filteredData.reduce((max, week) =>
            (week.total_visits || 0) > (max.total_visits || 0) ? week : max,
            filteredData[0] || {}
        );

        return {
            totalVisits,
            avgVisitsPerWeek,
            trend,
            trendPercentage,
            peakWeek,
            weeksAnalyzed: filteredData.length
        };
    };

    const formatWeekLabel = (weekData) => {
        if (weekData.week_start && weekData.week_end) {
            const startDate = new Date(weekData.week_start);
            const endDate = new Date(weekData.week_end);
            return `${startDate.getMonth() + 1}/${startDate.getDate()}`;
        }
        return weekData.week || 'Week';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {error}
                </div>
            </div>
        );
    }

    const stats = calculateStats();
    const filteredData = getFilteredData();

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Weekly Patient Visits</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Track weekly ANC patient visit patterns and trends
                </p>
            </div>

            {/* Time Period Selection */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viewing Period:
                </label>
                <select
                    value={selectedWeeks}
                    onChange={(e) => setSelectedWeeks(parseInt(e.target.value))}
                    className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                    {weekOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Visits
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {stats.totalVisits?.toLocaleString() || 0}
                                    </dd>
                                    <dd className="text-sm text-gray-500">
                                        {stats.weeksAnalyzed} weeks
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Weekly Average
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {stats.avgVisitsPerWeek?.toLocaleString() || 0}
                                    </dd>
                                    <dd className="text-sm text-gray-500">
                                        visits per week
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className={`h-8 w-8 ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Trend
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900 flex items-center">
                                        {stats.trend >= 0 ? (
                                            <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                                        )}
                                        {Math.abs(stats.trendPercentage || 0)}%
                                    </dd>
                                    <dd className="text-sm text-gray-500">
                                        {stats.trend >= 0 ? 'increasing' : 'decreasing'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Peak Week
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {stats.peakWeek?.total_visits?.toLocaleString() || 0}
                                    </dd>
                                    <dd className="text-sm text-gray-500">
                                        {formatWeekLabel(stats.peakWeek || {})}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Visits Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Visits Trend</h3>

                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="week"
                                tickFormatter={(value, index) => {
                                    const weekData = filteredData[index];
                                    return formatWeekLabel(weekData);
                                }}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value, payload) => {
                                    if (payload && payload[0]) {
                                        const weekData = payload[0].payload;
                                        return `Week: ${formatWeekLabel(weekData)}`;
                                    }
                                    return `Week: ${value}`;
                                }}
                                formatter={(value) => [value.toLocaleString(), 'Total Visits']}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="total_visits"
                                stroke="#3B82F6"
                                fill="#3B82F6"
                                fillOpacity={0.3}
                                strokeWidth={3}
                                name="Total Visits"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        No weekly visits data available
                    </div>
                )}
            </div>

            {/* Visit Type Breakdown (if available) */}
            {filteredData.some(week => week.new_visits || week.follow_up_visits) && (
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Type Breakdown</h3>

                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="week"
                                tickFormatter={(value, index) => {
                                    const weekData = filteredData[index];
                                    return formatWeekLabel(weekData);
                                }}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value, payload) => {
                                    if (payload && payload[0]) {
                                        const weekData = payload[0].payload;
                                        return `Week: ${formatWeekLabel(weekData)}`;
                                    }
                                    return `Week: ${value}`;
                                }}
                            />
                            <Legend />
                            <Bar dataKey="new_visits" stackId="visits" fill="#10B981" name="New Visits" />
                            <Bar dataKey="follow_up_visits" stackId="visits" fill="#3B82F6" name="Follow-up Visits" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Weekly Summary Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Weekly Summary
                    </h3>
                </div>

                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Week
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Visits
                                </th>
                                {filteredData.some(week => week.new_visits) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Visits
                                    </th>
                                )}
                                {filteredData.some(week => week.follow_up_visits) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Follow-up Visits
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trend
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((week, index) => {
                                const prevWeek = index > 0 ? filteredData[index - 1] : null;
                                const weekTrend = prevWeek ? week.total_visits - prevWeek.total_visits : 0;

                                return (
                                    <tr key={week.week || index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatWeekLabel(week)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(week.total_visits || 0).toLocaleString()}
                                        </td>
                                        {filteredData.some(w => w.new_visits) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(week.new_visits || 0).toLocaleString()}
                                            </td>
                                        )}
                                        {filteredData.some(w => w.follow_up_visits) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(week.follow_up_visits || 0).toLocaleString()}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index === 0 ? (
                                                <span className="text-gray-400">-</span>
                                            ) : (
                                                <div className="flex items-center">
                                                    {weekTrend > 0 ? (
                                                        <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                                                    ) : weekTrend < 0 ? (
                                                        <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                                                    ) : (
                                                        <span className="h-4 w-4 mr-1">-</span>
                                                    )}
                                                    <span className={weekTrend > 0 ? 'text-green-600' : weekTrend < 0 ? 'text-red-600' : 'text-gray-600'}>
                                                        {Math.abs(weekTrend)}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WeeklyVisits;