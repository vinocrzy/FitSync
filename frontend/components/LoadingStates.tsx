export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-700 border-t-neon-blue`} />
    </div>
  );
}

export function ModalLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-xl">
      <div className="w-full md:max-w-2xl ios-glass-float md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative w-full aspect-square md:aspect-video max-h-[50vh] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-8 bg-white/10 rounded-2xl animate-pulse w-2/3" />
          <div className="h-4 bg-white/5 rounded-xl animate-pulse w-1/3" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="ios-glass-card p-5 rounded-3xl flex items-center justify-between animate-pulse">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-5 bg-white/10 rounded-xl w-3/4" />
        <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        <div className="flex gap-1.5 mt-3">
          <div className="h-6 w-16 bg-white/5 rounded-full" />
          <div className="h-6 w-20 bg-white/5 rounded-full" />
        </div>
      </div>
      <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-white/5 ml-4" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8 space-y-2">
        <div className="h-10 bg-white/10 rounded-2xl animate-pulse w-64" />
        <div className="h-4 bg-white/5 rounded-xl animate-pulse w-96" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardLoadingSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
