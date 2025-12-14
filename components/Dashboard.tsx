import React from 'react';
import { useJobContext } from '../context/JobContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, CheckCircle, Briefcase, XCircle, FileText } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: any) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group`}>
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
      <Icon size={64} />
    </div>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${gradient} text-white shadow-lg shadow-indigo-200 dark:shadow-none`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { jobs, stats } = useJobContext();

  // Prepare chart data (Applications over last 30 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = jobs.filter(j => j.dateApplied === dateStr).length;
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      applications: count
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Applied" 
          value={stats.applied} 
          icon={FileText} 
          colorClass="text-blue-600"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700" 
        />
        <StatCard 
          title="Interviews" 
          value={stats.interview} 
          icon={Users} 
          colorClass="text-purple-600"
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
        />
        <StatCard 
          title="Offers Received" 
          value={stats.offer} 
          icon={CheckCircle} 
          colorClass="text-emerald-600"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={XCircle} 
          colorClass="text-rose-600"
          gradient="bg-gradient-to-br from-rose-500 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
            Application Activity (Last 7 Days)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorApps)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Recent Updates</h2>
          <div className="space-y-4">
            {jobs.slice(0, 4).map(job => (
              <div key={job.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  job.status === 'Offer' ? 'bg-emerald-500' :
                  job.status === 'Interview' ? 'bg-purple-500' :
                  job.status === 'Rejected' ? 'bg-rose-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.role}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{job.company}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-sm text-slate-400 italic">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;