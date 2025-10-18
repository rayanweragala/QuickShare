import { TrendingUp } from "lucide-react";

export const StatsCard = ({ icon: Icon, label, value, trend }) => (
  <div className="bg-neutral-800/40 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6 hover:border-green-500/30 transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-neutral-400 text-sm mb-1">{label}</p>
        <p className="text-white text-3xl font-bold">{value}</p>
        {trend && (
          <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-green-500" />
      </div>
    </div>
  </div>
);