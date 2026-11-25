import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Clock,
  Coffee,
  FileText,
  Globe,
  Hand,
  Heart,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessageSquareQuote,
  Sparkles,
  Waves,
} from 'lucide-react';
import { PresentationIconKey } from '../shared/mptEngine';

interface PresentationIconProps {
  iconKey: PresentationIconKey;
  className?: string;
}

export const PresentationIcon: React.FC<PresentationIconProps> = ({
  iconKey,
  className = 'w-3.5 h-3.5',
}) => {
  switch (iconKey) {
    case 'megaphone':
      return <Megaphone className={className} aria-hidden="true" />;
    case 'bell':
      return <Bell className={className} aria-hidden="true" />;
    case 'chat_quote':
      return <MessageSquareQuote className={className} aria-hidden="true" />;
    case 'hand_raise':
      return <Hand className={className} aria-hidden="true" />;
    case 'card_text':
      return <FileText className={className} aria-hidden="true" />;
    case 'alert_triangle':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'clock':
      return <Clock className={className} aria-hidden="true" />;
    case 'waves':
      return <Waves className={className} aria-hidden="true" />;
    case 'coffee':
      return <Coffee className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'lightbulb':
      return <Lightbulb className={className} aria-hidden="true" />;
    case 'globe':
      return <Globe className={className} aria-hidden="true" />;
    case 'bar_chart':
      return <BarChart3 className={className} aria-hidden="true" />;
    case 'message_dots':
    default:
      return <MessageSquare className={className} aria-hidden="true" />;
  }
};
