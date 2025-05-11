import React, { useState, useEffect } from 'react';

import { Loader2 } from 'lucide-react';

import { Separator } from 'src/s/components/ui/separator.tsx';
import { Button as ButtonShadcn } from 'src/s/components/ui/button.tsx';

import { postUpdateCalendarEvent } from 'src/api/calendar.js';
import { formatEventDateRange } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

const CalendarEvent = ({ calendarEvent, setCalendarEvent, mail }) => {
  const { user } = useAuthContext();
  // Add local state to track the current response status
  const [responseStatus, setResponseStatus] = useState(mail[0]?.invitationStatus || 'needsAction');

  // Add loading state for buttons
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(null);

  // Update local state when mail prop changes
  useEffect(() => {
    if (mail[0]?.invitationStatus) {
      setResponseStatus(mail[0].invitationStatus);
    }
  }, [mail]);

  const handleUpdateEventStatus = async (newStatus, eventId) => {
    // Set loading state for the specific button
    setIsLoading(true);
    setLoadingStatus(newStatus);

    try {
      const response = await postUpdateCalendarEvent({
        email: user?.email,
        response: newStatus,
        eventId: eventId,
      });

      console.log('API response:', response);

      // If the API call was successful, update the local state
      if (response.status === 200 || response.status === 201) {
        setResponseStatus(newStatus);

        // If you have a setter for calendarEvent, update it with the new data
        if (setCalendarEvent && response.data.event) {
          setCalendarEvent(response.data.event);
        }
      }
    } catch (error) {
      console.error('Error updating calendar event status:', error);
      // Optionally show an error message to the user
    } finally {
      // Clear loading state
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  // Helper to determine button styling
  const getButtonStyles = (status) => {
    const isActive = responseStatus === status;
    const isButtonLoading = loadingStatus === status && isLoading;

    let className = 'rounded ';

    if (isActive) {
      className +=
        'bg-[hsl(var(--primary-foreground))]  text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]';
    } else {
      className += '';
    }

    if (isButtonLoading) {
      className += 'cursor-not-allowed ';
    }

    return className;
  };

  return (
    <div className="flex rounded-[8px] bg-[hsl(var(--black-background))] p-[8px] mt-3">
      <div className="flex flex-row gap-5 w-full">
        <div className="flex flex-col justify-between h-full items-center rounded-[8px] bg-[hsl(var(--background))]">
          <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-center w-full text-xs px-5 py-2 rounded-t-[8px]">
            {new Date(calendarEvent?.start_time).toLocaleString('default', { month: 'short' })}
          </div>
          <div className="text-2xl py-2 px-5 text-center">
            {new Date(calendarEvent?.start_time).getDate()}
          </div>
          <Separator className="my-0" />
          <div className="py-2 px-5 text-center">
            {new Date(calendarEvent?.start_time).toLocaleString('default', { weekday: 'short' })}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start justify-center text-xs">
          <span className="text-sm mb-2 font-bold">{calendarEvent?.summary}</span>
          <div>
            <span className="text-[#ffffff5c] mr-2">When</span>
            <span className="">
              {formatEventDateRange(calendarEvent?.start_time, calendarEvent?.end_time)}
            </span>
          </div>
          <div>
            <span className="text-[#ffffff5c] mr-2">Who</span>
            {calendarEvent?.attendees?.map((attendee, index) => (
              <span key={index} className="">
                {attendee}
                {index < calendarEvent.attendees.length - 1 ? ' & ' : ''}
              </span>
            ))}
          </div>
          <div className="flex flex-row gap-3 mt-2">
            <ButtonShadcn
              onClick={() => {
                handleUpdateEventStatus('accepted', calendarEvent?.event_id);
              }}
              disabled={isLoading || responseStatus === 'accepted'}
              className={getButtonStyles('accepted')}
            >
              {loadingStatus === 'accepted' && isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                'Yes'
              )}
            </ButtonShadcn>
            <ButtonShadcn
              onClick={() => {
                handleUpdateEventStatus('declined', calendarEvent?.event_id);
              }}
              disabled={isLoading || responseStatus === 'declined'}
              className={getButtonStyles('declined')}
            >
              {loadingStatus === 'declined' && isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                'No'
              )}
            </ButtonShadcn>
            <ButtonShadcn
              onClick={() => {
                handleUpdateEventStatus('tentative', calendarEvent?.event_id);
              }}
              disabled={isLoading || responseStatus === 'tentative'}
              className={getButtonStyles('tentative')}
            >
              {loadingStatus === 'tentative' && isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                'Maybe'
              )}
            </ButtonShadcn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEvent;
