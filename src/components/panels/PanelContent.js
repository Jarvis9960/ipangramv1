import React from "react";
import {
  Check,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Users,
  Flag,
  Target,
  Clock,
  Shuffle,
  DollarSign,
  UserPlus,
  Smile,
  Workflow,
  Gauge,
  Eye,
  Maximize2,
  Briefcase,
  PhoneCall,
  Headphones,
  BookOpen,
  Settings,
  BarChart3,
  Sparkles,
  Cog,
  Activity,
  Layers,
  Zap,
} from "lucide-react";
import { useSceneStore } from "@/store/useSceneStore";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import SelfDrawLine from "@/components/anim/SelfDrawLine";

// Category accent palette — mirrors config/theme.js CATEGORY + App.css --cat-* tokens.
const CAT = ["#149A6E", "#00D4FF", "#CE8226", "#7C5BD0", "#3868D6"];
const TEAL = "#00D4FF";
const AMBER = "#CE8226";

// Fixed copy ⇒ fixed iconography (panelData strings never change at runtime).
const STAT_ICONS = [TrendingUp, Users, Flag];
const PILL_ICONS = [Target, Clock, Shuffle, DollarSign];
const CHALLENGE_ICONS = [UserPlus, Smile, Workflow, Gauge, Eye, Maximize2];
const WORKER_ICONS = [Briefcase, PhoneCall, Headphones, BookOpen, Settings, BarChart3];
const SYSTEM_ICONS = [TrendingUp, Sparkles, Cog, Users, Activity];
const FRAMEWORK = [
  { icon: Layers, accent: TEAL },
  { icon: Zap, accent: "#3868D6" },
  { icon: TrendingUp, accent: AMBER },
];

// Inline style for the per-beat reveal cascade + accent-aware classes.
// `i` drives the stagger (--i), `c` sets the card accent colour (--card-accent).
const rise = (i, c) => {
  const s = { "--i": i };
  if (c) s["--card-accent"] = c;
  return s;
};

// Insight callout — the italic "better systems do" line, elevated into a quoted card.
function Insight({ children, i }) {
  return (
    <div
      className="glass-card glass-card--bar panel-rise p-4 flex gap-3 items-start"
      style={rise(i, TEAL)}
    >
      <Sparkles size={16} className="text-[#00D4FF] mt-[3px] shrink-0" />
      <p className="text-[14px] sm:text-[15px] text-[#10203A] italic leading-[1.6]">{children}</p>
    </div>
  );
}

function CTAButtons({ ctas }) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
      {ctas.map((c, i) => {
        const primary = c.variant === "primary";
        return (
          <button
            key={i}
            data-testid={i === 0 ? "right-data-panel-primary-cta" : "right-data-panel-secondary-cta"}
            style={rise(i + 3)}
            className={`cursor-hover btn panel-rise text-[13px] sm:text-[14px] ${primary ? "btn-primary" : "btn-ghost"}`}
          >
            {c.label}
            {primary && <ArrowRight size={16} className="lucide-arrow-right" />}
          </button>
        );
      })}
    </div>
  );
}

export default function PanelContent({ data, animated }) {
  const selection = useSceneStore((s) => s.selection);
  const setSelection = useSceneStore((s) => s.setSelection);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 panel-rise" style={rise(0)}>
        <span className="panel-eyebrow text-[11px] sm:text-[12px]">{data.eyebrow}</span>
        <SelfDrawLine className="text-[#00D4FF] opacity-70 shrink-0" width={40} animated={animated} />
      </div>

      <AnimatedHeading
        as={data.type === "hero" ? "h1" : "h2"}
        text={data.title}
        testid="right-data-panel-title"
        className={data.type === "hero" ? "panel-h1" : "panel-h2"}
        animated={animated}
      />

      {data.body && (
        <p data-testid="right-data-panel-body" className="panel-body panel-rise" style={rise(2)}>
          {data.body}
        </p>
      )}

      {/* INTRO — the four systems that form the one connected organism */}
      {data.type === "intro" && (
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {[
            { label: "Customer", Icon: Users, c: CAT[0] },
            { label: "Operations", Icon: Cog, c: CAT[2] },
            { label: "Knowledge", Icon: BookOpen, c: CAT[3] },
            { label: "Growth", Icon: TrendingUp, c: CAT[4] },
          ].map((n, i) => {
            const NodeIcon = n.Icon;
            return (
              <div
                key={i}
                className="glass-card glass-card--bar panel-rise p-3.5 flex items-center gap-3"
                style={rise(i + 3, n.c)}
              >
                <span className="icon-badge">
                  <NodeIcon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[13.5px] text-[#10203A] leading-tight">{n.label}</div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#8492A8] mt-0.5">
                    System
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HERO / FINAL CTA */}
      {(data.type === "hero" || data.type === "finalCTA") && <CTAButtons ctas={data.ctas} />}
      {data.type === "finalCTA" && (
        <p className="text-[13px] text-[#5B6A85] leading-[1.6] panel-rise" style={rise(5)}>
          {data.socialProof}
        </p>
      )}

      {/* STATS — the three forces reshaping growth */}
      {data.type === "stats" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.stats.map((s, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              return (
                <div
                  key={i}
                  data-testid={`panel-stat-card-${i}`}
                  className="glass-card glass-card--topbar panel-rise p-4 flex flex-col gap-3"
                  style={rise(i + 3, TEAL)}
                >
                  <div className="flex items-center justify-between">
                    <span className="icon-badge" style={{ width: "2rem", height: "2rem" }}>
                      <Icon size={15} />
                    </span>
                    <span className="num-tabular font-mono text-[11px] text-[#8492A8]">0{i + 1}</span>
                  </div>
                  <span
                    data-testid={`panel-stat-card-${i}-label`}
                    className="text-[13px] sm:text-[13.5px] font-semibold text-[#10203A] leading-[1.3]"
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
          <Insight i={6}>{data.insight}</Insight>
        </>
      )}

      {/* PILLS — consequences of fragmented systems (amber semantic) */}
      {data.type === "pills" && (
        <>
          <div className="flex flex-wrap gap-2.5">
            {data.pills.map((p, i) => {
              const Icon = PILL_ICONS[i % PILL_ICONS.length];
              return (
                <span
                  key={i}
                  data-testid={`panel-consequence-pill-${i}`}
                  style={rise(i + 3)}
                  className="panel-rise inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium text-[#10203A] border border-[rgba(206,130,38,0.28)] bg-[rgba(206,130,38,0.1)] shadow-[var(--shadow-1)]"
                >
                  <Icon size={14} className="text-[#CE8226]" />
                  {p}
                </span>
              );
            })}
          </div>
          <Insight i={8}>{data.insight}</Insight>
        </>
      )}

      {/* PILLARS — five critical systems, each in its own category colour */}
      {data.type === "pillars" && (
        <div className="grid grid-cols-1 gap-3">
          {data.cards.map((c, i) => {
            const active = selection.pillar === i;
            return (
              <button
                key={i}
                data-testid={`panel-pillar-card-${i}`}
                onClick={() => setSelection("pillar", i)}
                style={rise(i + 3, c.color)}
                className={`cursor-hover text-left glass-card glass-card--bar panel-rise p-4 ${active ? "glass-card--active" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="font-semibold text-[15px] text-[#10203A]">{c.title}</span>
                </div>
                <p className="mt-2 text-[13px] text-[#5B6A85] leading-[1.6]">{c.body}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* CHALLENGES — six outcomes, icon-badge grid */}
      {data.type === "challenges" && (
        <div className="grid grid-cols-1 gap-2.5">
          {data.rows.map((r, i) => {
            const Icon = CHALLENGE_ICONS[i % CHALLENGE_ICONS.length];
            return (
              <div
                key={i}
                data-testid={`panel-challenge-row-${i}`}
                className="flex items-start gap-3 glass-card panel-rise p-3.5"
                style={rise(i + 3, AMBER)}
              >
                <span className="icon-badge">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#10203A]">{r.title}</div>
                  <div className="text-[13px] text-[#5B6A85] leading-[1.55] mt-0.5">{r.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FRAMEWORK — Build / Automate / Scale, distinct accents + top rail */}
      {data.type === "framework" && (
        <div className="grid grid-cols-1 gap-3.5">
          {data.columns.map((col, ci) => {
            const F = FRAMEWORK[ci % FRAMEWORK.length];
            const Icon = F.icon;
            return (
              <div
                key={ci}
                data-testid={`panel-framework-col-${ci}`}
                className="glass-card glass-card--topbar panel-rise p-4"
                style={rise(ci + 3, F.accent)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="icon-badge">
                    <Icon size={16} />
                  </span>
                  <div>
                    <div className="font-semibold text-[15px] text-[#10203A] tracking-[-0.01em]">{col.title}</div>
                    <div className="text-[12.5px] text-[#5B6A85] leading-[1.4]">{col.subtitle}</div>
                  </div>
                </div>
                <ul className="mt-3.5 space-y-2">
                  {col.bullets.map((b, bi) => (
                    <li key={bi} className="flex gap-2 text-[13px] text-[#10203A]">
                      <Check size={15} className="mt-[2px] shrink-0" style={{ color: F.accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* WORKERS — six digital workers, hover drives the 3D scene */}
      {data.type === "workers" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.workers.map((w, i) => {
              const Icon = WORKER_ICONS[i % WORKER_ICONS.length];
              const active = selection.worker === i;
              return (
                <div
                  key={i}
                  data-testid={`panel-worker-card-${i}`}
                  onMouseEnter={() => setSelection("worker", i)}
                  onMouseLeave={() => setSelection("worker", null)}
                  style={rise(i + 3, CAT[i % CAT.length])}
                  className={`cursor-hover glass-card panel-rise p-4 ${active ? "glass-card--active" : ""}`}
                >
                  <span className="icon-badge mb-3">
                    <Icon size={16} />
                  </span>
                  <div className="font-semibold text-[14px] text-[#10203A]">{w.title}</div>
                  <p className="mt-1.5 text-[13px] text-[#5B6A85] leading-[1.55]">{w.body}</p>
                </div>
              );
            })}
          </div>
          {data.cta && (
            <button
              data-testid="right-data-panel-primary-cta"
              style={rise(9)}
              className="cursor-hover btn btn-primary panel-rise text-[14px]"
            >
              {data.cta.label}
              <ArrowRight size={16} className="lucide-arrow-right" />
            </button>
          )}
        </>
      )}

      {/* SYSTEMS — five intelligent systems, category-tinted badges */}
      {data.type === "systems" && (
        <div className="grid grid-cols-1 gap-2.5">
          {data.cards.map((c, i) => {
            const Icon = SYSTEM_ICONS[i % SYSTEM_ICONS.length];
            return (
              <div
                key={i}
                data-testid={`panel-system-card-${i}`}
                className="flex items-start gap-3 glass-card panel-rise p-4"
                style={rise(i + 3, CAT[i % CAT.length])}
              >
                <span className="icon-badge">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] text-[#10203A]">{c.title}</div>
                  <div className="text-[13px] text-[#5B6A85] leading-[1.55] mt-0.5">{c.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INDUSTRIES — segmented tab control + content card */}
      {data.type === "industries" && (
        <div>
          <div data-testid="panel-industry-tabs" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.tabs.map((tab, ti) => {
              const active = selection.industry === tab.key;
              return (
                <button
                  key={tab.key}
                  data-testid={`panel-industry-tab-${tab.key}`}
                  onClick={() => setSelection("industry", tab.key)}
                  style={rise(ti + 3, TEAL)}
                  className={`cursor-hover panel-rise font-mono text-[10px] sm:text-[11px] tracking-[0.1em] uppercase px-3 py-2.5 rounded-[11px] border transition-[background,border-color,color,box-shadow] ${
                    active
                      ? "glass-card--active text-[#10203A]"
                      : "border-[rgba(16,32,58,0.12)] text-[#5B6A85] hover:text-[#10203A] hover:border-[rgba(16,32,58,0.22)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div
            data-testid="panel-industry-content"
            className="mt-4 glass-card glass-card--bar panel-rise p-4 flex gap-3 items-start"
            style={rise(9, TEAL)}
          >
            {(() => {
              const tab = data.tabs.find((t) => t.key === selection.industry) || data.tabs[0];
              return (
                <>
                  <span className="icon-badge">
                    <ChevronRight size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-[15px] text-[#10203A]">{tab.label}</div>
                    <p className="mt-1 text-[13px] text-[#5B6A85] leading-[1.6]">{tab.body}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* WHY + HOW — reason cards + a connected process timeline */}
      {data.type === "whyHow" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.reasons.map((r, i) => (
              <div
                key={i}
                data-testid={`panel-reason-card-${i}`}
                className="glass-card glass-card--bar panel-rise p-4"
                style={rise(i + 3, CAT[i % CAT.length])}
              >
                <div className="font-semibold text-[14px] text-[#10203A]">{r.title}</div>
                <p className="mt-1.5 text-[13px] text-[#5B6A85] leading-[1.55]">{r.body}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 panel-rise" style={rise(7)}>
            <p className="panel-eyebrow text-[11px]">{data.processEyebrow}</p>
            <h3 className="mt-2 text-[20px] font-semibold text-[#10203A] tracking-[-0.01em]">{data.processTitle}</h3>
          </div>
          <div className="relative flex flex-col gap-2.5">
            {data.steps.map((s, i) => (
              <div
                key={i}
                data-testid={`panel-process-step-${i}`}
                className="relative flex gap-3.5 glass-card panel-rise p-3.5 items-start"
                style={rise(i + 8, TEAL)}
              >
                {/* connector line between numbered nodes */}
                {i < data.steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[31px] top-[3rem] -bottom-2.5 w-px bg-[rgba(0,212,255,0.3)]"
                  />
                )}
                <span className="num-tabular w-8 h-8 rounded-full bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.32)] grid place-items-center font-bold text-[13px] text-[#00D4FF] shrink-0 z-[1]">
                  {i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="font-semibold text-[14px] text-[#10203A]">{s.title}</div>
                  <div className="text-[13px] text-[#5B6A85] leading-[1.5] mt-0.5">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
