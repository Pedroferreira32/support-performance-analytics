import {
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  Flag,
  Gauge,
  Medal,
  Percent,
  ShieldCheck,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const icons = {
  gauge: Gauge,
  medal: Medal,
  check: CheckCircle2,
  trophy: Trophy,
  shield: ShieldCheck,
  star: Star,
  database: Database,
  trend: TrendingUp,
  timer: Timer,
  clock: Clock,
  percent: Percent,
  x: XCircle,
  flag: Flag,
  bot: Bot,
  upload: Upload,
  calendar: CalendarDays,
  target: Target,
  award: Award,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function AppIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Cmp = icons[name];
  return <Cmp className={className} />;
}
