import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./Shared";
import { getOwnerColors, PRIORITY_COLORS } from "../helpers";
import { useTheme } from "../ThemeContext";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({ d, allItems, getStatus, setItemStatus, goToSection }) {
  const { theme } = useTheme();
  const OWNER_COLORS = getOwnerColors(d);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); setSelectedDay(null); };

  // Group tasks by due date
  const tasksByDate = {};
  allItems.forEach(it => {
    if (it.due) {
      const d2 = new Date(it.due + "T00:00:00");
      if (d2.getFullYear() === year && d2.getMonth() === month) {
        const day = d2.getDate();
        if (!tasksByDate[day]) tasksByDate[day] = [];
        tasksByDate[day].push(it);
      }
    }
  });

  const todayKey = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;
  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] || []) : [];

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Calendar
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg border-none cursor-pointer" style={{ background: theme.bgCard, color: theme.textMuted }}><ChevronLeft size={18} /></button>
        <span className="text-lg font-bold" style={{ color: theme.text }}>{monthName}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg border-none cursor-pointer" style={{ background: theme.bgCard, color: theme.textMuted }}><ChevronRight size={18} /></button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${theme.border}` }}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7" style={{ background: theme.bgCard }}>
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center" style={{ fontSize: 10, fontWeight: 700, color: theme.textDim, borderBottom: `1px solid ${theme.border}` }}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={"e" + i} style={{ background: theme.bg, borderBottom: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, minHeight: 72 }} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const tasks = tasksByDate[day] || [];
            const isToday = day === todayKey;
            const isSelected = day === selectedDay;
            const hasOverdue = tasks.some(t => !d.checks[t.id]) && new Date(year, month, day) < now;
            const doneCount = tasks.filter(t => d.checks[t.id]).length;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className="relative cursor-pointer transition-colors"
                style={{
                  minHeight: 72, padding: "4px 6px",
                  background: isSelected ? theme.accentBg : theme.bg,
                  borderBottom: `1px solid ${theme.border}`,
                  borderRight: `1px solid ${theme.border}`,
                  outline: isSelected ? `2px solid ${theme.accent}` : isToday ? `2px solid ${theme.accent}40` : "none",
                  outlineOffset: -2,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ fontSize: 12, color: isToday ? theme.accent : theme.text }}>
                    {day}
                  </span>
                  {tasks.length > 0 && (
                    <span className="px-1 rounded-full font-bold" style={{ fontSize: 8, background: hasOverdue ? "#ef444430" : doneCount === tasks.length ? "#22c55e30" : theme.bgCard, color: hasOverdue ? "#ef4444" : doneCount === tasks.length ? "#22c55e" : theme.textMuted }}>
                      {doneCount}/{tasks.length}
                    </span>
                  )}
                </div>
                {/* Task dots */}
                <div className="flex gap-0.5 flex-wrap mt-1">
                  {tasks.slice(0, 4).map((t, ti) => (
                    <div key={ti} className="w-1.5 h-1.5 rounded-full" style={{ background: d.checks[t.id] ? "#22c55e" : PRIORITY_COLORS[t.p] }} />
                  ))}
                  {tasks.length > 4 && <span style={{ fontSize: 7, color: theme.textDim }}>+{tasks.length - 4}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-xl p-4" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <div className="font-bold mb-3" style={{ fontSize: 13, color: theme.text }}>
            {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            <span className="ml-2 font-normal" style={{ color: theme.textMuted }}>{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {selectedTasks.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.textDim }}>No tasks due this day.</div>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map(it => (
                <div key={it.id} className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: theme.bg, border: `1px solid ${theme.border}`, opacity: d.checks[it.id] ? 0.5 : 1 }}>
                  <select value={getStatus(it.id)} onChange={(e) => setItemStatus(it.id, e.target.value)} className="px-1 py-0.5 rounded bg-transparent font-semibold cursor-pointer outline-none" style={{ fontSize: 9, border: `1px solid ${d.checks[it.id] ? "#22c55e" : theme.border}`, color: d.checks[it.id] ? "#22c55e" : theme.textMuted }}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <span className={`flex-1 ${d.checks[it.id] ? "line-through" : ""}`} style={{ fontSize: 12, color: theme.text }}>{it.text}</span>
                  <Badge text={it.owner} color={OWNER_COLORS[it.owner]} />
                  <Badge text={it.p} color={PRIORITY_COLORS[it.p]} />
                  <span style={{ fontSize: 10, color: theme.textDim }}>{it.sectionTitle}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        {[
          { c: PRIORITY_COLORS.CRITICAL, l: "Critical" },
          { c: PRIORITY_COLORS.HIGH, l: "High" },
          { c: PRIORITY_COLORS.MEDIUM, l: "Medium" },
          { c: "#22c55e", l: "Done" },
        ].map(lg => (
          <div key={lg.l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: lg.c }} />
            <span style={{ fontSize: 10, color: theme.textDim }}>{lg.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
