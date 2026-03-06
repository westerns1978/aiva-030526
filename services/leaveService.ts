
import { westflow } from './westflowClient';
import { LeaveRequest } from '../types';

export const leaveService = {
  /**
   * Submits a formal leave request to the WestFlow orchestrator.
   */
  submitLeaveRequest: async (request: LeaveRequest) => {
    try {
      const response = await westflow.submitLeaveRequest(
        request.tech_id,
        request.leave_type,
        request.start_date,
        request.end_date,
        request.reason,
        request.half_day
      );
      return response;
    } catch (error) {
      console.error("[LeaveService] Submission failed:", error);
      return { success: false, error: "Network or circuit failure." };
    }
  },

  /**
   * Validates leave dates, ensuring end_date matches start_date if half_day is selected.
   */
  prepareRequest: (data: Partial<LeaveRequest>): LeaveRequest => {
    const isHalfDay = !!data.half_day;
    return {
      tech_id: data.tech_id || 'UNKNOWN',
      leave_type: data.leave_type || 'annual',
      start_date: data.start_date || '',
      end_date: isHalfDay ? (data.start_date || '') : (data.end_date || ''),
      reason: data.reason || '',
      half_day: isHalfDay
    };
  }
};
