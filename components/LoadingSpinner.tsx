export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
      <div className="text-center">
        {/* Animated Spice Logo */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 animate-ping opacity-20"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 animate-spin"></div>
          <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
            <span className="text-2xl animate-pulse">✨</span>
          </div>
        </div>
        
        {/* Loading Text with Animation */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm text-gray-500">Loading</span>
          <span className="text-sm text-gray-500 animate-bounce delay-0">.</span>
          <span className="text-sm text-gray-500 animate-bounce delay-150">.</span>
          <span className="text-sm text-gray-500 animate-bounce delay-300">.</span>
        </div>
        
        {/* Brand Message */}
        <p className="text-xs text-pink-300 mt-4">Spice Diana • The People's Princess</p>
      </div>
    </div>
  )
}