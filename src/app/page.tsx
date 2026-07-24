"use client";

import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import {
  ChevronRight,
  ChevronLeft,
  Award,
  ClipboardList,
  Check,
} from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge, PodiumBadge } from "@/components/ui/Badges";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { cn, formatDate } from "@/lib/utils";
import { actRankingPtsDetails } from "@/lib/calc";
import type { ParticipantBasic, Activity, Invitacion } from "@/lib/types";

interface RankingWithStats extends ParticipantBasic {
  total: number;
  gf: number;
  gh: number;
  gb: number;
  acts: number;
  goals?: number;
}

interface InvitacionWithActivity {
  inv: Invitacion;
  activity: Activity;
}

interface InvitacionRanking extends ParticipantBasic {
  invitedCount: number;
  invitaciones: InvitacionWithActivity[];
}

const PODIUM_COLORS = [
  { bg: "#F59E0B", text: "#fff", shadow: "#F59E0B44" },
  { bg: "#94A3B8", text: "#fff", shadow: "#94A3B844" },
  { bg: "#B45309", text: "#fff", shadow: "#B4530944" },
];

const RANKING_METRICS = [
  { key: "total", label: "Puntos", Icon: Award },
  { key: "acts", label: "Asist.", Icon: ClipboardList },
] as const;

type RankingMetricKey = (typeof RANKING_METRICS)[number]["key"];

function RankRow({
  p,
  pos,
  metric,
  isClickable = false,
  onClick,
}: {
  p: RankingWithStats;
  pos: number;
  metric: RankingMetricKey;
  isClickable?: boolean;
  onClick?: () => void;
}) {
  const metricValue = p[metric] || 0;

  const className = cn(
    "bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/15 relative overflow-hidden",
    pos <= 3 && "border-primary/40 bg-primary/15",
    isClickable &&
      "w-full text-left cursor-pointer transition-all hover:border-primary/40 active:scale-[0.99]",
  );

  const content = (
    <>
      {pos <= 3 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: PODIUM_COLORS[pos - 1].bg + "0A" }}
        />
      )}
      <RankBadge pos={pos} />
      <Avatar p={p} size={32} />
      <div className="flex-1 z-10 min-w-0">
        <div className="font-bold text-sm truncate">
          {p.nombre} {p.apellido}
        </div>
      </div>
      <div className="font-black text-xl z-10">{metricValue}</div>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function RankingDetailView({
  player,
  activities,
  participants,
  onBack,
}: {
  player: RankingWithStats;
  activities: Activity[];
  participants: ParticipantBasic[];
  onBack: () => void;
}) {
  const activityHistory = useMemo(() => {
    return activities
      .map((activity) => {
        const details = actRankingPtsDetails(player.id, activity, participants);
        const total = details.reduce((sum, detail) => sum + detail.pts, 0);
        return { activity, details, total };
      })
      .filter((item) => item.details.length > 0)
      .sort(
        (a, b) =>
          new Date(b.activity.fecha).getTime() - new Date(a.activity.fecha).getTime(),
      );
  }, [activities, participants, player.id]);

  const total = activityHistory.reduce((sum, item) => sum + item.total, 0);

  return (
    <>
      {/* Back button + player header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Avatar p={player} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg text-foreground truncate">
            {player.nombre} {player.apellido}
          </div>
          <div className="text-xs font-bold text-text-muted">
            {activityHistory.length} actividad{activityHistory.length !== 1 ? "es" : ""} con puntos
          </div>
        </div>
      </div>

      {/* Total points card */}
      <div className="bg-primary text-white rounded-2xl p-4 text-center mb-5 shadow-inner">
        <div className="text-4xl font-black tabular-nums">{total}</div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
          Puntos Totales
        </div>
      </div>

      {/* Activity history */}
      {activityHistory.length > 0 ? (
        <div className="flex flex-col gap-3">
          {activityHistory.map(({ activity, details, total: activityTotal }) => (
            <div
              key={activity.id}
              className="bg-primary/5 rounded-2xl border border-primary/15 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-black text-foreground truncate">
                    {activity.titulo || formatDate(activity.fecha)}
                  </div>
                  <div className="text-xs font-bold text-text-muted mt-1">
                    {formatDate(activity.fecha)}
                  </div>
                </div>
                <div className="bg-primary/10 text-primary rounded-xl px-3 py-1 text-sm font-black tabular-nums shrink-0">
                  {activityTotal >= 0 ? "+" : ""}
                  {activityTotal}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {details.map((detail, index) => (
                  <div
                    key={`${detail.type}-${detail.label}-${index}`}
                    className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-primary/10"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">
                        {detail.label}
                      </div>
                      {detail.sublabel && (
                        <div className="text-xs font-medium text-text-muted truncate">
                          {detail.sublabel}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "font-black text-sm tabular-nums shrink-0",
                        detail.pts >= 0 ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {detail.pts >= 0 ? "+" : ""}
                      {detail.pts}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-text-muted text-sm py-10 font-medium italic">
          Sin puntos registrados aún
        </div>
      )}
    </>
  );
}

export default function Page() {
  const { db, isLoading } = useApp();
  const { participants, activities, rankings } = db;
  const role = useStore($role);
  // Sheet states
  const [goleadoresOpen, setGoleadoresOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [invitacionesOpen, setInvitacionesOpen] = useState(false);

  const [rankingMetric, setRankingMetric] = useState<RankingMetricKey>("total");
  const [selectedInviter, setSelectedInviter] =
    useState<InvitacionRanking | null>(null);
  const [selectedRankingPlayer, setSelectedRankingPlayer] =
    useState<RankingWithStats | null>(null);
  const [rankingView, setRankingView] = useState<"list" | "detail">("list");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [invFilterOpen, setInvFilterOpen] = useState(false);

  const calculatedRankings = useMemo(() => {
    return (participants || [])
      .map((p) => {
        const stats = (rankings || []).find((r) => r.id === p.id) || {
          total: 0,
          gf: 0,
          gh: 0,
          gb: 0,
          acts: 0,
        };
        return { ...p, ...stats };
      })
      .sort((a, b) => {
        const valA = a[rankingMetric] || 0;
        const valB = b[rankingMetric] || 0;
        return valB - valA;
      });
  }, [participants, rankings, rankingMetric]);

  const stats = useMemo(() => {
    const jugadoresActivos = (participants || []).filter((p) =>
      (activities || []).some((a) => (a.asistentes || []).includes(p.id)),
    ).length;

    const totalGoles = (activities || []).reduce(
      (acc, a) => acc + (a.goles || []).reduce((s, g) => s + g.cant, 0),
      0,
    );

    const totalPlayers = (participants || []).length;

    const top3Scorers = calculatedRankings
      .map((p) => ({
        ...p,
        goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0),
      }))
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);

    const allScorers = calculatedRankings
      .map((p) => ({
        ...p,
        goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0),
      }))
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals);

    return {
      jugadoresActivos,
      porcentajeActivos: participants.length
        ? Math.round((jugadoresActivos / participants.length) * 100)
        : 0,
      totalGoles,
      totalPlayers,
      top3Scorers,
      allScorers,
    };
  }, [calculatedRankings, participants, activities]);

  const invitacionRanking = useMemo(() => {
    const counts: Record<
      number,
      { total: number; invitaciones: { inv: Invitacion; activity: Activity }[] }
    > = {};

    const actsToCount = selectedActivityIds.length > 0
      ? (activities || []).filter((a) => selectedActivityIds.includes(a.id))
      : (activities || []);

    actsToCount.forEach((act) => {
      (act.invitaciones || []).forEach((inv) => {
        if (inv.invitador) {
          if (!counts[inv.invitador]) {
            counts[inv.invitador] = { total: 0, invitaciones: [] };
          }
          counts[inv.invitador].total += 1;
          counts[inv.invitador].invitaciones.push({ inv, activity: act });
        }
      });
    });

    return (participants || [])
      .map((p) => ({
        ...p,
        invitedCount: counts[p.id]?.total || 0,
        invitaciones: counts[p.id]?.invitaciones || [],
      }))
      .filter((p) => p.invitedCount > 0)
      .sort((a, b) => b.invitedCount - a.invitedCount);
  }, [participants, activities, selectedActivityIds]);

  const getInvitadosDetails = (
    invitaciones: { inv: Invitacion; activity: Activity }[],
  ) => {
    return invitaciones
      .map((item) => {
        const invited = (participants || []).find(
          (p) => p.id === item.inv.invitadoId,
        );
        if (!invited) return null;
        return { invited, activity: item.activity };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/15">
            <div className="text-2xl font-black text-primary bg-white/50 rounded-lg py-1">
              {activities.length}
            </div>
            <div className="text-xs font-bold text-text-muted mt-1.5">
              Actividades
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/15">
            <div className="text-2xl font-black text-primary bg-white/50 rounded-lg py-1">
              {stats.totalPlayers}
            </div>
            <div className="text-xs font-bold text-text-muted mt-1.5">
              Jugadores
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/15">
            <div className="text-2xl font-black text-primary bg-white/50 rounded-lg py-1">
              {stats.totalGoles}
            </div>
            <div className="text-xs font-bold text-text-muted mt-1.5">
              Total Goles
            </div>
          </div>
        </div>

        {/* ─── GOLEADORES ─── */}
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer select-none"
          onClick={() => setGoleadoresOpen(true)}
        >
          <div className="font-bold text-lg">Goleadores</div>
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </div>
        {stats.top3Scorers.length === 0 ? (
          <div className="text-center py-4 text-xs text-text-muted italic mb-4">
            Aún no hay goles registrados
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {stats.top3Scorers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 bg-primary/10 rounded-xl border border-primary/15"
              >
                <PodiumBadge
                  pos={i + 1}
                  className="w-6 h-6 bg-white border-0 text-primary font-bold"
                />
                <Avatar p={p} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="font-black text-primary text-lg">
                  {p.goals}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── RANKING ─── */}
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer select-none"
          onClick={() => setRankingOpen(true)}
        >
          <div className="font-bold text-lg">Puntaje</div>
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </div>
        {calculatedRankings.length === 0 ? (
          <div className="text-center py-4 text-xs text-text-muted italic mb-4">
            Aún no hay participantes
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {calculatedRankings.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 bg-primary/10 rounded-xl border border-primary/15"
              >
                <PodiumBadge
                  pos={i + 1}
                  className="w-6 h-6 bg-white border-0 text-primary font-bold"
                />
                <Avatar p={p} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="font-black text-primary text-lg">
                  {p.total}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── INVITACIONES ─── */}
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer select-none"
          onClick={() => setInvitacionesOpen(true)}
        >
          <div className="font-bold text-lg">Invitaciones</div>
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </div>
        {invitacionRanking.length === 0 ? (
          <div className="text-center py-4 text-xs text-text-muted italic mb-4">
            No hay invitaciones registradas
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {invitacionRanking.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 bg-primary/10 rounded-xl border border-primary/15"
              >
                <PodiumBadge
                  pos={i + 1}
                  className="w-6 h-6 bg-white border-0 text-primary font-bold"
                />
                <Avatar p={p} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="font-black text-primary text-lg">
                  {p.invitedCount}
                  <span className="text-[10px] opacity-50 font-bold ml-0.5">inv.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SHEET: GOLEADORES ─── */}
      <DetailSheet
        open={goleadoresOpen}
        onOpenChange={setGoleadoresOpen}
        title="Goleadores"
      >
        {stats.allScorers.length === 0 ? (
          <Empty text="Aún no hay goles registrados" />
        ) : (
          <div className="flex flex-col gap-2">
            {stats.allScorers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/15"
              >
                <PodiumBadge
                  pos={i + 1}
                  className="w-6 h-6 bg-white border-0 text-primary font-bold"
                />
                <Avatar p={p} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="font-black text-primary bg-white px-2 py-1 rounded-lg text-xs">
                  {p.goals}{" "}
                  <span className="text-[10px] opacity-50 font-bold">goles</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSheet>

      {/* ─── SHEET: RANKING ─── */}
      <DetailSheet
        open={rankingOpen}
        onOpenChange={(open) => {
          setRankingOpen(open);
          if (!open) setRankingView("list");
        }}
        title="Puntaje"
      >
        {rankingView === "detail" && selectedRankingPlayer ? (
          <RankingDetailView
            player={selectedRankingPlayer}
            activities={activities}
            participants={participants}
            onBack={() => setRankingView("list")}
          />
        ) : (
          <>
            {/* Metric selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RANKING_METRICS.map((metric) => {
                const Icon = metric.Icon;
                return (
                  <button
                    key={metric.key}
                    onClick={() => setRankingMetric(metric.key)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all",
                      rankingMetric === metric.key
                        ? "bg-primary text-white"
                        : "bg-surface-dark text-text-muted hover:bg-surface-dark/80",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{metric.label}</span>
                  </button>
                );
              })}
            </div>

            {calculatedRankings.length === 0 ? (
              <Empty text="Aún no hay participantes" />
            ) : (
              <div className="flex flex-col gap-2">
                {calculatedRankings.map((p, i) => (
                  <RankRow
                    key={p.id}
                    p={p}
                    pos={i + 1}
                    metric={rankingMetric}
                    isClickable={rankingMetric === "total"}
                    onClick={
                      rankingMetric === "total"
                        ? () => {
                            setSelectedRankingPlayer(p);
                            setRankingView("detail");
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </DetailSheet>

      {/* ─── SHEET: INVITACIONES ─── */}
      <DetailSheet
        open={invitacionesOpen}
        onOpenChange={setInvitacionesOpen}
        title="Invitaciones"
      >
        {/* Activity filter */}
        {activities.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setInvFilterOpen(!invFilterOpen)}
              className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-dark transition-colors"
            >
              <span className={cn(
                "w-4 h-4 rounded border flex items-center justify-center",
                selectedActivityIds.length === 0
                  ? "bg-primary border-primary"
                  : "border-surface-dark"
              )}>
                {selectedActivityIds.length === 0 && <Check className="w-3 h-3 text-white" />}
              </span>
              {selectedActivityIds.length === 0
                ? "Todas las actividades"
                : `${selectedActivityIds.length} actividad${selectedActivityIds.length > 1 ? "es" : ""} seleccionada${selectedActivityIds.length > 1 ? "s" : ""}`}
            </button>
            {invFilterOpen && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto bg-surface-dark/30 rounded-xl p-2">
                <button
                  onClick={() => setSelectedActivityIds([])}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-left transition-colors",
                    selectedActivityIds.length === 0
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-text-muted hover:bg-surface-dark/50"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    selectedActivityIds.length === 0
                      ? "bg-primary border-primary"
                      : "border-surface-dark"
                  )}>
                    {selectedActivityIds.length === 0 && <Check className="w-3 h-3 text-white" />}
                  </span>
                  Todas
                </button>
                {[...activities]
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((act) => {
                    const selected = selectedActivityIds.includes(act.id);
                    return (
                      <button
                        key={act.id}
                        onClick={() => {
                          setSelectedActivityIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== act.id)
                              : [...prev, act.id]
                          );
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-left transition-colors",
                          selected
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-text-muted hover:bg-surface-dark/50"
                        )}
                      >
                        <span className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          selected
                            ? "bg-primary border-primary"
                            : "border-surface-dark"
                        )}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="truncate">{act.titulo || formatDate(act.fecha)}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {invitacionRanking.length === 0 ? (
          <Empty text="No hay invitaciones registradas" />
        ) : (
          <div className="flex flex-col gap-2">
            {invitacionRanking.map((p, i) => (
              <div
                key={p.id}
                onClick={() => {
                  setInvitacionesOpen(false);
                  setSelectedInviter(p);
                }}
                className={cn(
                  "bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/15 cursor-pointer transition-colors",
                  i <= 2 && "border-primary/40 bg-primary/15",
                )}
              >
                <PodiumBadge
                  pos={i + 1}
                  className="w-6 h-6 bg-white border-0 text-primary font-bold"
                />
                <Avatar p={p} size={32} />
                <div className="flex-1 z-10 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="font-black text-lg z-10">
                  {p.invitedCount}
                  <span className="text-[10px] font-bold text-text-muted ml-0.5">
                    inv.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSheet>

      {/* ─── MODALS ─── */}
      {selectedInviter && (
        <DetailSheet
          open={!!selectedInviter}
          onOpenChange={(open) => !open && setSelectedInviter(null)}
          title={`${selectedInviter.nombre} ${selectedInviter.apellido}`}
        >
          <div className="text-sm text-text-muted mb-4">
            {selectedInviter.invitedCount} invitados
          </div>
          <div className="flex flex-col gap-2">
            {getInvitadosDetails(selectedInviter.invitaciones).map(
              (detail, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 bg-primary/10 rounded-xl border border-primary/15"
                >
                  <Avatar p={detail.invited} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {detail.invited.nombre} {detail.invited.apellido}
                    </div>
                    {detail.activity && (
                      <div className="text-xs text-text-muted truncate">
                        {detail.activity.titulo ||
                          formatDate(detail.activity.fecha)}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </DetailSheet>
      )}
    </>
  );
}
