import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  subject: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  join_url?: string | null;
  attendees?: unknown;
  lead_id?: string | null;
  contact_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  status: string;
  lead_name?: string | null;
  contact_name?: string | null;
}

interface MeetingsCalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 20;

export const MeetingsCalendarView = ({ meetings, onMeetingClick }: MeetingsCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const displayDays = viewMode === 'week' ? daysInWeek : [currentDate];

  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return isSameDay(meetingDate, day);
    });
  };

  const getMeetingPosition = (meeting: Meeting) => {
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const top = (startHour - WORK_START_HOUR) * 60 + startMinute;
    const height = ((endHour - startHour) * 60) + (endMinute - startMinute);
    
    return { top, height: Math.max(height, 30) }; // Minimum height of 30px
  };

  const getMeetingColor = (meeting: Meeting) => {
    if (meeting.status === 'cancelled') return 'bg-destructive/20 border-destructive/40 text-destructive-foreground';
    const now = new Date();
    const meetingStart = new Date(meeting.start_time);
    if (meetingStart < now) return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    return 'bg-primary/20 border-primary/40 text-primary-foreground';
  };

  const workHours = HOURS.filter(h => h >= WORK_START_HOUR && h < WORK_END_HOUR);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold ml-2">
            {viewMode === 'week' 
              ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
              : format(currentDate, 'EEEE, MMMM d, yyyy')
            }
          </h2>
        </div>
        
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {/* Day Headers */}
          <div className="flex border-b sticky top-0 bg-card z-10">
            <div className="w-16 flex-shrink-0 border-r" /> {/* Time column spacer */}
            {displayDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 text-center py-3 border-r last:border-r-0",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-xl font-semibold mt-1",
                    isToday && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="flex">
            {/* Time Labels */}
            <div className="w-16 flex-shrink-0 border-r">
              {workHours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] text-xs text-muted-foreground text-right pr-2 -mt-2"
                >
                  {format(setHours(setMinutes(new Date(), 0), hour), 'h a')}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {displayDays.map((day) => {
              const dayMeetings = getMeetingsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 border-r last:border-r-0 relative",
                    isToday && "bg-primary/5"
                  )}
                >
                  {/* Hour grid lines */}
                  {workHours.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-dashed border-border/50"
                    />
                  ))}

                  {/* Meetings */}
                  {dayMeetings.map((meeting) => {
                    const { top, height } = getMeetingPosition(meeting);
                    if (top < 0 || top > (WORK_END_HOUR - WORK_START_HOUR) * 60) return null;
                    
                    return (
                      <div
                        key={meeting.id}
                        onClick={() => onMeetingClick(meeting)}
                        className={cn(
                          "absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer transition-all hover:shadow-md overflow-hidden",
                          getMeetingColor(meeting)
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: '28px',
                        }}
                      >
                        <div className="flex items-start gap-1">
                          {meeting.join_url && (
                            <Video className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">
                              {meeting.subject}
                            </div>
                            {height > 40 && (
                              <div className="text-xs opacity-70 truncate">
                                {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                              </div>
                            )}
                            {height > 60 && (meeting.lead_name || meeting.contact_name) && (
                              <div className="text-xs opacity-70 truncate mt-1">
                                {meeting.lead_name || meeting.contact_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {isToday && (
                    <CurrentTimeIndicator />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CurrentTimeIndicator = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) return null;
  
  const top = (hour - WORK_START_HOUR) * 60 + minute;
  
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <div className="flex-1 h-0.5 bg-destructive" />
      </div>
    </div>
  );
};
