import React, { useState, useEffect } from 'react';

const CloudFunctionStatus = () => {
  const [functions, setFunctions] = useState([
    // {
    //   name: 'Gmail Email Processor',
    //   url: process.env.NEXT_PUBLIC_GMAIL_EMAIL_URL || 'http://localhost:8080/gmail_email_entry_point?health=check',
    //   status: 'loading',
    //   lastChecked: null,
    //   error: null
    // },
    // {
    //   name: 'Daily Subscription Renewal',
    //   url: process.env.NEXT_PUBLIC_DAILY_SUB_URL || 'http://localhost:8080/daily_sub_entry_point?health=check',
    //   status: 'loading',
    //   lastChecked: null,
    //   error: null
    // },
    {
      name: 'Last 30 Days Batch',
      url:
        process.env.NEXT_PUBLIC_LAST_30_DAYS_URL ||
        'http://localhost:8082/last_30_days?health=check',
      status: 'loading',
      lastChecked: null,
      error: null,
    },
    // {
    //   name: 'Onboarding Pinecone',
    //   url: process.env.NEXT_PUBLIC_ONBOARDING_PINECONE_URL || 'http://localhost:8080/onboarding_pinecone_entry_point?health=check',
    //   status: 'loading',
    //   lastChecked: null,
    //   error: null
    // },
    // {
    //   name: 'Onboarding Categories',
    //   url: process.env.NEXT_PUBLIC_ONBOARDING_CATEGORIES_URL || 'http://localhost:8080/onboarding_categories_entry_point?health=check',
    //   status: 'loading',
    //   lastChecked: null,
    //   error: null
    // },
    {
      name: 'Retrieve Email by Labels',
      url:
        process.env.NEXT_PUBLIC_RETRIEVE_EMAIL_URL ||
        'http://localhost:8083/retrieve_email_by_labels_entry_point?health=check',
      status: 'loading',
      lastChecked: null,
      error: null,
    },
  ]);

  useEffect(() => {
    const checkStatus = async () => {
      const updatedFunctions = await Promise.all(
        functions.map(async (func) => {
          try {
            // First, try using the Next.js API route to proxy the request
            // This helps avoid CORS issues (App Router format)
            const requestUrl = `/api/check-function-status?url=${encodeURIComponent(func.url)}`;

            const startTime = Date.now();
            const response = await fetch(requestUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;

            if (response.ok) {
              // Try to parse JSON, but don't fail if it's not valid JSON
              let data = {};
              try {
                data = await response.json();
              } catch (e) {
                // If not JSON, that's okay - the function is still responding
              }

              return {
                ...func,
                status: 'healthy',
                lastChecked: new Date(),
                responseTime: `${responseTimeMs}ms`,
                error: null,
              };
            } else {
              return {
                ...func,
                status: 'error',
                lastChecked: new Date(),
                responseTime: `${responseTimeMs}ms`,
                error: `Error: ${response.status}`,
              };
            }
          } catch (error) {
            return {
              ...func,
              status: 'error',
              lastChecked: new Date(),
              error: error.message,
            };
          }
        })
      );

      setFunctions(updatedFunctions);
    };

    // Initial check
    checkStatus();

    // Set up polling every 30 seconds
    const intervalId = setInterval(checkStatus, 30000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="bg-hsl(var(--black-background)) rounded-xl border-white border shadow p-4 max-w-md mx-auto">
      <h2 className="text-md font-semibold mb-1">
        MicroServices Status (Only for local installation)
      </h2>
      <div className="mt-0 text-xs text-gray-400 text-left">Auto-refreshes every 30 seconds</div>

      <div className="space-y-4">
        {functions.map((func, index) => (
          <div key={index} className="border rounded-md p-2">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">{func.name}</div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(func.status)}`}></div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <div>
                Status: <span className="font-medium">{func.status}</span>
              </div>
              <div>Last checked: {formatTime(func.lastChecked)}</div>
              {func.responseTime && <div>Response time: {func.responseTime}</div>}
              {func.error && <div className="text-red-500 text-xs mt-1">Error: {func.error}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CloudFunctionStatus;
