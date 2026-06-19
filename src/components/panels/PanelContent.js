import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, ChevronRight } from "lucide-react";
import { useSceneStore } from "@/store/useSceneStore";
import { itemVariants } from "@/components/ui/motion";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import SelfDrawLine from "@/components/anim/SelfDrawLine";

// MaybeMotion: animate on capable devices, render statically (always visible)
// on low-tier / software / reduced-motion contexts.
function makeItem(animated) {
  return function Item({ as = "div", className, children, testid, ...rest }) {
    if (animated) {
      const M = motion[as] || motion.div;
      return (
        <M variants={itemVariants} className={className} data-testid={testid} {...rest}>
          {children}
        </M>
      );
    }
    const Tag = as;
    return (
      <Tag className={className} data-testid={testid} {...rest}>
        {children}
      </Tag>
    );
  };
}

function CTAButtons({ ctas, Item }) {
  return (
    <Item className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
      {ctas.map((c, i) => {
        const primary = c.variant === "primary";
        return (
          <button
            key={i}
            data-testid={i === 0 ? "right-data-panel-primary-cta" : "right-data-panel-secondary-cta"}
            className={`cursor-hover text-[13px] sm:text-[14px] font-semibold rounded-[10px] px-5 py-3 transition-[background,box-shadow,border-color,transform] ${
              primary
                ? "bg-[#1A9C88] text-white hover:bg-[#137A6B] hover:shadow-[0_10px_30px_-8px_rgba(26,156,136,0.5)] hover:-translate-y-0.5"
                : "bg-transparent text-[#10203A] border border-[rgba(16,32,58,0.14)] hover:border-[#1A9C88] hover:bg-[rgba(26,156,136,0.08)]"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </Item>
  );
}

export default function PanelContent({ data, animated }) {
  const selection = useSceneStore((s) => s.selection);
  const setSelection = useSceneStore((s) => s.setSelection);
  const Item = makeItem(animated);

  return (
    <div className="flex flex-col gap-5">
      <Item as="div" className="flex items-center gap-3">
        <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.14em] uppercase text-[#1A9C88]">
          {data.eyebrow}
        </span>
        <SelfDrawLine className="text-[#1A9C88] opacity-70 shrink-0" width={40} animated={animated} />
      </Item>

      <AnimatedHeading
        as={data.type === "hero" ? "h1" : "h2"}
        text={data.title}
        testid="right-data-panel-title"
        className={data.type === "hero" ? "panel-h1" : "panel-h2"}
        animated={animated}
      />

      {data.body && (
        <Item as="p" testid="right-data-panel-body" className="panel-body">
          {data.body}
        </Item>
      )}

      {/* HERO / FINAL CTA */}
      {(data.type === "hero" || data.type === "finalCTA") && <CTAButtons ctas={data.ctas} Item={Item} />}
      {data.type === "finalCTA" && (
        <Item as="p" className="text-[13px] text-[#5B6A85] leading-[1.6]">
          {data.socialProof}
        </Item>
      )}

      {/* STATS */}
      {data.type === "stats" && (
        <>
          <Item className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.stats.map((s, i) => (
              <div key={i} data-testid={`panel-stat-card-${i}`} className="glass-card p-4 flex flex-col gap-2">
                <span className="h-[2px] w-9 bg-[#1A9C88] rounded-full" />
                <span data-testid={`panel-stat-card-${i}-label`} className="text-[13px] font-semibold text-[#10203A] leading-[1.3]">
                  {s}
                </span>
              </div>
            ))}
          </Item>
          <Item className="mt-1 pl-4 border-l-2 border-[#1A9C88] text-[#10203A] text-[14px] sm:text-[15px] italic leading-[1.6]">
            {data.insight}
          </Item>
        </>
      )}

      {/* PILLS */}
      {data.type === "pills" && (
        <>
          <Item className="flex flex-wrap gap-2">
            {data.pills.map((p, i) => (
              <span
                key={i}
                data-testid={`panel-consequence-pill-${i}`}
                className="px-3 py-2 rounded-full border border-[rgba(16,32,58,0.12)] text-[13px] text-[#10203A] bg-[rgba(217,138,43,0.1)]"
              >
                {p}
              </span>
            ))}
          </Item>
          <Item className="mt-1 pl-4 border-l-2 border-[#1A9C88] text-[#10203A] text-[14px] sm:text-[15px] italic leading-[1.6]">
            {data.insight}
          </Item>
        </>
      )}

      {/* PILLARS */}
      {data.type === "pillars" && (
        <Item className="grid grid-cols-1 gap-3">
          {data.cards.map((c, i) => {
            const active = selection.pillar === i;
            return (
              <button
                key={i}
                data-testid={`panel-pillar-card-${i}`}
                onClick={() => setSelection("pillar", i)}
                className={`cursor-hover text-left glass-card p-4 transition-[border-color,background] ${
                  active ? "border-[#1A9C88] bg-[rgba(26,156,136,0.08)]" : "hover:border-[rgba(16,32,58,0.2)]"
                }`}
                style={{ borderLeft: `3px solid ${c.color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="font-semibold text-[15px] text-[#10203A]">{c.title}</span>
                </div>
                <p className="mt-2 text-[13px] text-[#5B6A85] leading-[1.6]">{c.body}</p>
              </button>
            );
          })}
        </Item>
      )}

      {/* CHALLENGES */}
      {data.type === "challenges" && (
        <Item className="flex flex-col gap-2">
          {data.rows.map((r, i) => (
            <div key={i} data-testid={`panel-challenge-row-${i}`} className="flex items-start gap-3 glass-card p-3">
              <ArrowRight size={16} className="text-[#D98A2B] mt-[3px] shrink-0" />
              <div>
                <div className="text-[14px] font-medium text-[#10203A]">{r.title}</div>
                <div className="text-[13px] text-[#5B6A85] leading-[1.55]">{r.body}</div>
              </div>
            </div>
          ))}
        </Item>
      )}

      {/* FRAMEWORK */}
      {data.type === "framework" && (
        <Item className="grid grid-cols-1 gap-4">
          {data.columns.map((col, ci) => (
            <div key={ci} data-testid={`panel-framework-col-${ci}`} className="glass-card p-4">
              <div className="font-mono text-[12px] tracking-[0.12em] uppercase text-[#1A9C88]">{col.title}</div>
              <div className="mt-1 text-[13px] text-[#5B6A85]">{col.subtitle}</div>
              <ul className="mt-3 space-y-2">
                {col.bullets.map((b, bi) => (
                  <li key={bi} className="flex gap-2 text-[13px] text-[#10203A]">
                    <Check size={15} className="text-[#1A9C88] mt-[2px] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Item>
      )}

      {/* WORKERS */}
      {data.type === "workers" && (
        <>
          <Item className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.workers.map((w, i) => (
              <div
                key={i}
                data-testid={`panel-worker-card-${i}`}
                onMouseEnter={() => setSelection("worker", i)}
                onMouseLeave={() => setSelection("worker", null)}
                className="cursor-hover glass-card p-4 transition-[border-color,background] hover:border-[#1A9C88] hover:bg-[rgba(26,156,136,0.06)]"
              >
                <div className="font-semibold text-[14px] text-[#10203A]">{w.title}</div>
                <p className="mt-1.5 text-[13px] text-[#5B6A85] leading-[1.55]">{w.body}</p>
              </div>
            ))}
          </Item>
          {data.cta && (
            <Item>
              <button
                data-testid="right-data-panel-primary-cta"
                className="cursor-hover bg-[#1A9C88] text-white text-[14px] font-semibold rounded-[10px] px-5 py-3 hover:bg-[#137A6B] hover:shadow-[0_10px_30px_-8px_rgba(26,156,136,0.5)] transition-[background,box-shadow]"
              >
                {data.cta.label}
              </button>
            </Item>
          )}
        </>
      )}

      {/* SYSTEMS */}
      {data.type === "systems" && (
        <Item className="grid grid-cols-1 gap-3">
          {data.cards.map((c, i) => (
            <div key={i} data-testid={`panel-system-card-${i}`} className="flex items-start gap-3 glass-card p-4">
              <span className="w-7 h-7 rounded-[8px] bg-[rgba(26,156,136,0.12)] border border-[rgba(16,32,58,0.1)] grid place-items-center shrink-0">
                <ChevronRight size={15} className="text-[#1A9C88]" />
              </span>
              <div>
                <div className="font-semibold text-[14px] text-[#10203A]">{c.title}</div>
                <div className="text-[13px] text-[#5B6A85] leading-[1.55]">{c.body}</div>
              </div>
            </div>
          ))}
        </Item>
      )}

      {/* INDUSTRIES */}
      {data.type === "industries" && (
        <Item>
          <div data-testid="panel-industry-tabs" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.tabs.map((tab) => {
              const active = selection.industry === tab.key;
              return (
                <button
                  key={tab.key}
                  data-testid={`panel-industry-tab-${tab.key}`}
                  onClick={() => setSelection("industry", tab.key)}
                  className={`cursor-hover font-mono text-[10px] sm:text-[11px] tracking-[0.1em] uppercase px-3 py-2 rounded-[10px] border transition-[background,border-color,color] ${
                    active
                      ? "bg-[rgba(26,156,136,0.14)] border-[#1A9C88] text-[#10203A]"
                      : "border-[rgba(16,32,58,0.12)] text-[#5B6A85] hover:text-[#10203A]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div data-testid="panel-industry-content" className="mt-4 glass-card p-4">
            {(() => {
              const tab = data.tabs.find((t) => t.key === selection.industry) || data.tabs[0];
              return (
                <>
                  <div className="font-semibold text-[15px] text-[#10203A]">{tab.label}</div>
                  <p className="mt-1.5 text-[13px] text-[#5B6A85] leading-[1.6]">{tab.body}</p>
                </>
              );
            })()}
          </div>
        </Item>
      )}

      {/* WHY + HOW */}
      {data.type === "whyHow" && (
        <>
          <Item className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.reasons.map((r, i) => (
              <div key={i} data-testid={`panel-reason-card-${i}`} className="glass-card p-4">
                <div className="font-semibold text-[14px] text-[#10203A]">{r.title}</div>
                <p className="mt-1.5 text-[13px] text-[#5B6A85] leading-[1.55]">{r.body}</p>
              </div>
            ))}
          </Item>
          <Item className="pt-2">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#1A9C88]">{data.processEyebrow}</p>
            <h3 className="mt-2 text-[20px] font-semibold text-[#10203A] tracking-[-0.01em]">{data.processTitle}</h3>
          </Item>
          <Item className="flex flex-col gap-2">
            {data.steps.map((s, i) => (
              <div key={i} data-testid={`panel-process-step-${i}`} className="flex gap-3 glass-card p-3 items-start">
                <span className="w-8 h-8 rounded-full bg-[rgba(26,156,136,0.12)] border border-[rgba(16,32,58,0.1)] grid place-items-center font-bold tabular-nums text-[13px] text-[#1A9C88] shrink-0">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-[14px] text-[#10203A]">{s.title}</div>
                  <div className="text-[13px] text-[#5B6A85] leading-[1.5]">{s.body}</div>
                </div>
              </div>
            ))}
          </Item>
        </>
      )}
    </div>
  );
}
