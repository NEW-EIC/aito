import { Calendar, Clock, User, Users } from "lucide-react";
import { Card } from "@aito/ui";
import { TierPill } from "@aito/ui";

export interface LiveClass {
  date: string;
  time: string;
  title: string;
  desc: string;
  host: string;
  role: string;
  tier: string;
  seats: number;
}

export function LiveCard({ item, capacity }: { item: LiveClass; capacity: string }) {
  return (
    <Card hover className="p-6 md:p-7 flex flex-col md:flex-row gap-6">
      <div className="md:w-44 shrink-0 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-fg-soft tabular-nums-feature">
          <Calendar className="size-3.5" />
          {item.date}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-fg-muted tabular-nums-feature">
          <Clock className="size-3.5" />
          {item.time}
        </div>
        <TierPill tier={item.tier} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-xl md:text-2xl font-semibold text-fg leading-tight">
          {item.title}
        </h3>
        <p className="mt-2 text-fg-muted leading-relaxed">{item.desc}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-fg-soft">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3.5" />
            <span className="font-medium text-fg-muted">{item.host}</span>
            <span>· {item.role}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums-feature">
            <Users className="size-3.5" />
            {item.seats} {capacity}
          </span>
        </div>
      </div>
    </Card>
  );
}
