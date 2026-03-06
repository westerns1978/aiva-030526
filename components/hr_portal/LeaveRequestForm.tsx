
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { leaveService } from '../../services/leaveService';
import { CheckCircleIcon, CloseIcon, CalendarOffIcon } from '../icons';

interface LeaveRequestFormProps {
    onCancel: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onCancel }) => {
    const { currentUser, addToast } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: 'annual' as 'annual' | 'sick' | 'family' | 'maternity' | 'study',
        start_date: '',
        end_date: '',
        reason: '',
        half_day: false
    });

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData(prev => ({
            ...prev,
            start_date: val,
            end_date: prev.half_day ? val : prev.end_date
        }));
    };

    const handleHalfDayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            half_day: checked,
            end_date: checked ? prev.start_date : prev.end_date
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.start_date || (!formData.half_day && !formData.end_date)) {
            addToast("Temporal parameters incomplete. Please select dates.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const request = leaveService.prepareRequest({
                ...formData,
                tech_id: currentUser?.employeeNumber || 'NP-GUEST'
            });

            const resp = await leaveService.submitLeaveRequest(request);

            if (resp.success) {
                addToast(`Leave protocol initialized: ${request.half_day ? 'Half Day' : 'Full Day'} recorded.`, "success");
                onCancel(); 
            } else {
                throw new Error(resp.error || "Submission rejected by Mesh.");
            }
        } catch (err) {
            addToast("Circuit Breach: Could not transmit leave request.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary/10 rounded-2xl">
                        <CalendarOffIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Leave Submission Protocol</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono">Uplink: {currentUser?.name || 'Authorized Guest'}</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <CloseIcon className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Classification</label>
                        <select 
                            value={formData.leave_type}
                            onChange={e => setFormData({ ...formData, leave_type: e.target.value as any })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-primary outline-none transition-all shadow-inner"
                        >
                            <option value="annual">Annual Leave</option>
                            <option value="sick">Sick Leave</option>
                            <option value="family">Family Responsibility</option>
                            <option value="maternity">Maternity/Parental</option>
                            <option value="study">Study Leave</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-6 pl-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    checked={formData.half_day}
                                    onChange={handleHalfDayToggle}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-brand-primary transition-all"></div>
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-brand-primary transition-colors">Half Day Request</span>
                        </label>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Execution Date</label>
                        <input 
                            type="date" 
                            value={formData.start_date}
                            onChange={handleStartDateChange}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-primary outline-none transition-all shadow-inner"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Conclusion Date</label>
                        <input 
                            type="date" 
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            disabled={formData.half_day}
                            className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:border-brand-primary outline-none transition-all shadow-inner ${formData.half_day ? 'opacity-30 grayscale cursor-not-allowed bg-slate-200 dark:bg-slate-800' : ''}`}
                            required={!formData.half_day}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Contextual Details (Optional)</label>
                    <textarea 
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Provide strategic details for HR review..."
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-medium focus:border-brand-primary outline-none transition-all resize-none shadow-inner"
                    />
                </div>

                <div className="pt-4 flex gap-4">
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-600"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-2 w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-2xl hover:brightness-110 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Transmitting...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Submit Request
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
