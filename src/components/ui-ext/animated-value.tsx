import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

function parseValue(v: string) {
  const m = v.match(/^([^\d-]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  const num = Number(raw.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(num)) return null;
  const dec = raw.includes(",") ? raw.split(",")[1].length : 0;
  return { num, dec, prefix: m[1], suffix: m[3] };
}

export function AnimatedValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const parsed = parseValue(value);
  const animated = useCountUp(parsed?.num ?? 0);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  const text = animated.toLocaleString("pt-BR", {
    minimumFractionDigits: parsed.dec,
    maximumFractionDigits: parsed.dec,
  });

  return (
    <span className={cn("mono", className)}>
      {parsed.prefix}
      {text}
      {parsed.suffix}
    </span>
  );
}
