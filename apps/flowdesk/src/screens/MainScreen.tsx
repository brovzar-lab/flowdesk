import { isDemoMode } from '../lib/config';
import DemoBanner from '../components/DemoBanner';
import TaskList from '../components/TaskList';
import ScheduleTimeline from '../components/ScheduleTimeline';
import PaywallModal from '../components/PaywallModal';

export default function MainScreen() {
  return (
    <div className="flex flex-col h-full bg-navy-900">
      {isDemoMode && <DemoBanner />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-bold text-slate-100 tracking-wide">FlowDesk</span>
        </div>
        <span className="text-xs text-slate-600">Monday · May 18</span>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Task list */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden relative">
          <TaskList />
        </div>

        {/* Right: Schedule timeline */}
        <div className="flex-1 overflow-hidden">
          <ScheduleTimeline />
        </div>
      </div>

      <PaywallModal />
    </div>
  );
}
