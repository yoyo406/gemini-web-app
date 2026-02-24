import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SearchX } from 'lucide-react';

export default function EmptyState({ searchQuery }) {
  if (searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 flex flex-col items-center py-20 text-center"
      >
        <SearchX className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">Aucun résultat</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-[220px]">
          Aucune note ne correspond à « {searchQuery} »
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-2 flex flex-col items-center py-20 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <Sparkles className="w-12 h-12 text-blue-400/50 mb-4" />
      </motion.div>
      <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">Espace vide</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-[220px]">
        Appuie sur le bouton + pour créer ta première note
      </p>
    </motion.div>
  );
}
