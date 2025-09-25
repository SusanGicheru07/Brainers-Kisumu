import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, Phone, AlertCircle } from 'lucide-react';

const AccessPending = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">Access Pending</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Your access request has been submitted and is pending approval from the hospital administrator.
                        </p>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        What happens next?
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Hospital administrator will review your request</li>
                                            <li>You'll receive an email notification once approved</li>
                                            <li>After approval, you can log in with your credentials</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Mail className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Need help?
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            If you don't hear back within 2-3 business days, please contact
                                            the hospital directly or reach out to our support team.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="text-sm text-gray-500 space-y-2">
                                <p className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Support: support@matricare.co.ke
                                </p>
                                <p className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Phone: +254 700 000 000
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Return to Login
                        </Link>
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            to="/staff-request-access"
                            className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                            Submit another request
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessPending;