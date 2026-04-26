// src/components/EmptyState.jsx
import { motion } from 'framer-motion'

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  action,
  color = 'text-zinc-500' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 bg-[#0a0a0a] rounded-2xl border-2 border-dashed border-zinc-800"
    >
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 rounded-full blur-xl" />
        <div className="relative bg-zinc-900 rounded-full p-5 flex items-center justify-center">
          <Icon className={color} size={48} strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-2xl font-light text-white mb-3">{title}</h3>
      <p className="text-zinc-500 max-w-md mx-auto px-4 mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}