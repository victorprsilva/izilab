import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white rounded-full shadow-lg shadow-brand-start/30 hover:shadow-brand-start/50 transform hover:scale-105 active:scale-95 transition-all duration-200"
      title="Enviar Feedback"
    >
      <MessageSquare size={18} />
      <span className={`text-sm font-medium overflow-hidden transition-all duration-200 ${isHovered ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>
        Feedback
      </span>
    </button>
  );
};

export default FeedbackButton;
