import { useMemo } from 'react';

/**
 * Custom hook to determine attendance check-in/check-out status
 */
const useAttendanceStatus = (leaveHistory, attendanceStatus) => {
  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }, []);

  const isOnLeave = useMemo(() => {
    if (!leaveHistory || leaveHistory.length === 0) return false;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return leaveHistory.some(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(todayStr);
      return current >= start && current <= end && l.status === 'Approved';
    });
  }, [leaveHistory]);

  const canCheckIn = !isWeekend && !isOnLeave && attendanceStatus === 'Not Checked In';
  const canCheckOut = attendanceStatus === 'Checked In';
  const isCheckedOut = attendanceStatus === 'Checked Out';

  let reason = null;
  if (isWeekend) reason = 'Weekend';
  else if (isOnLeave) reason = 'On Leave';

  let statusBadgeVariant = 'secondary';
  if (attendanceStatus === 'Checked In') statusBadgeVariant = 'success';
  else if (attendanceStatus === 'Checked Out') statusBadgeVariant = 'danger';

  return {
    canCheckIn,
    canCheckOut,
    isCheckedOut,
    isWeekend,
    isOnLeave,
    reason,
    statusBadgeVariant
  };
};

export default useAttendanceStatus;
