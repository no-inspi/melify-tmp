import React, { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from 'src/s/components/ui/dropdown-menu';
import { Button } from 'src/s/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ChevronDown,
  Server
} from 'lucide-react';
import {Badge} from 'src/s/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/s/components/ui/tooltip';
import {cloud_functions} from 'src/utils/constants';


const DropDownStatus = () => {
  const [statuses, setStatuses] = useState(
    cloud_functions.map(fn => ({
      name: fn.name,
      status: 'loading',
      lastChecked: new Date()
    }))
  );
  const [isChecking, setIsChecking] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(null);

  // Status counters
  const onlineCount = statuses.filter(s => s.status === 'online').length;
  const offlineCount = statuses.filter(s => s.status === 'offline').length;
  const errorCount = statuses.filter(s => s.status === 'error').length;
  
  useEffect(() => {
    // Check status on component mount
    checkAllStatuses();
    
    // Set up interval to check statuses every 5 minutes
    const intervalId = setInterval(checkAllStatuses, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkStatus = async (functionConfig, index) => {
    try {
      // Update the specific function status to loading
      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          ...newStatuses[index],
          status: 'loading',
          lastChecked: new Date()
        };
        return newStatuses;
      });

      // Make the request to the API endpoint that checks your cloud function
      const response = await fetch(`/api/check-function-status?url=${encodeURIComponent(functionConfig.url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Process the response
      if (response.ok) {
        // Function is online
        setStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[index] = {
            name: functionConfig.name,
            status: 'online',
            message: 'Function is running normally',
            lastChecked: new Date()
          };
          return newStatuses;
        });
      } else {
        // Function returned an error
        const errorData = await response.json();
        setStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[index] = {
            name: functionConfig.name,
            status: 'error',
            message: errorData.error || `Error: ${response.status}`,
            lastChecked: new Date()
          };
          return newStatuses;
        });
      }
    } catch (error) {
      // Could not connect to function
      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          name: functionConfig.name,
          status: 'offline',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          lastChecked: new Date()
        };
        return newStatuses;
      });
    }
  };

  const checkAllStatuses = async () => {
    setIsChecking(true);
    
    // Check all functions in parallel
    await Promise.all(
      cloud_functions.map((fn, index) => checkStatus(fn, index))
    );
    
    setIsChecking(false);
  };

  // Get appropriate icon and color for status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'offline':
        return <XCircle className="text-red-500" size={16} />;
      case 'error':
        return <AlertCircle className="text-amber-500" size={16} />;
      case 'loading':
        return <RefreshCw className="text-blue-500 animate-spin" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  // Get badge for the overall status
  const getOverallStatusBadge = () => {
    if (isChecking) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Checking...</Badge>;
    }
    if (offlineCount > 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">{offlineCount} Offline</Badge>;
    }
    if (errorCount > 0) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">{errorCount} Errors</Badge>;
    }
    if (onlineCount === cloud_functions.length) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">All Online</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  // Format the last checked time
  const formatLastChecked = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Server size={16} />
            <span>Cloud Functions</span>
            {getOverallStatusBadge()}
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Cloud Functions Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {statuses.map((status, index) => (
            <Tooltip key={status.name} open={openTooltip === status.name}>
              <TooltipTrigger asChild>
                <DropdownMenuItem 
                  className="flex justify-between items-center cursor-default"
                  onMouseEnter={() => status.message && setOpenTooltip(status.name)}
                  onMouseLeave={() => setOpenTooltip(null)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span>{status.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatLastChecked(status.lastChecked)}</span>
                </DropdownMenuItem>
              </TooltipTrigger>
              {status.message && (
                <TooltipContent side="left">
                  <p>{status.message}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => checkAllStatuses()}
            disabled={isChecking}
            className="flex justify-between items-center"
          >
            <span>Refresh Status</span>
            <RefreshCw size={16} className={isChecking ? "animate-spin" : ""} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default DropDownStatus;