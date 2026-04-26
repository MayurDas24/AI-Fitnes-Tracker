// src/components/LoadingSkeleton.jsx
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Quote skeleton */}
    <div className="h-20 bg-[#18181b] rounded-2xl animate-pulse" />
    
    {/* Chart skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[300px] bg-[#18181b] rounded-[2rem] animate-pulse" />
      <div className="h-[300px] bg-[#18181b] rounded-[2rem] animate-pulse" />
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-44 bg-[#18181b] rounded-[2rem] animate-pulse" />
      ))}
    </div>
  </div>
)

export const ExerciseSkeleton = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[1,2,3,4,5,6].map(i => (
      <div key={i} className="bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden">
        <div className="aspect-[16/9] bg-zinc-800 animate-pulse" />
        <div className="p-8 space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-zinc-800 rounded-2xl animate-pulse" />
            <div className="h-16 bg-zinc-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-12 bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

export const WorkoutSkeleton = () => (
  <div className="space-y-6">
    {[1,2,3].map(i => (
      <div key={i} className="bg-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(j => (
            <div key={j} className="h-24 bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export const DietSkeleton = () => (
  <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
      ))}
    </div>
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
)

export const WaterSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <div className="h-20 bg-gray-800/70 rounded-xl animate-pulse" />
    <div className="bg-gray-800 p-8 rounded-2xl">
      <div className="h-64 w-48 mx-auto bg-gray-700 rounded-b-3xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-24 bg-blue-500/10 rounded-xl mt-8 animate-pulse" />
      <div className="grid grid-cols-2 gap-4 mt-8">
        {[1, 2].map(i => (
          <div key={i} className="h-14 bg-gray-900 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
    <div className="bg-gray-800 p-6 rounded-2xl space-y-4">
      <div className="h-7 w-48 bg-gray-700 rounded animate-pulse" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-12 bg-gray-900 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
)

export const BodyAnalysisSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    <div className="h-10 w-72 bg-slate-800/60 rounded-xl animate-pulse" />
    <div className="grid lg:grid-cols-2 gap-10">
      <div className="space-y-6">
        <div className="h-20 bg-slate-900/50 rounded-xl animate-pulse" />
        <div className="h-72 bg-slate-900/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-slate-900/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-14 bg-slate-900/50 rounded-2xl animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-10 w-60 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-900/50 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
)

export const CalculatorSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-6">
    <div className="bg-zinc-900 border border-zinc-800 p-8 space-y-5">
      <div className="h-7 w-44 bg-zinc-800 rounded animate-pulse" />
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-12 bg-black border-b-2 border-zinc-800 animate-pulse" />
        </div>
      ))}
      <div className="h-14 bg-red-900/30 rounded animate-pulse" />
    </div>
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 space-y-4">
          <div className="h-8 w-40 bg-zinc-800 rounded animate-pulse" />
          <div className="h-20 bg-black rounded animate-pulse" />
          <div className="h-12 bg-black rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
)

export const ShimmerCard = () => (
  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shimmer">
    <div className="h-4 w-1/3 rounded bg-slate-700/80 mb-3" />
    <div className="h-3 w-full rounded bg-slate-700/70 mb-2" />
    <div className="h-3 w-5/6 rounded bg-slate-700/70" />
  </div>
)

export const ShimmerStat = () => (
  <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 shimmer">
    <div className="h-3 w-1/2 rounded bg-slate-700/80 mb-2" />
    <div className="h-6 w-2/3 rounded bg-slate-700/70" />
  </div>
)