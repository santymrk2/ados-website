"use client";

import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import {
  Trophy,
  Volleyball,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Award,
  ClipboardList,
  Users,
  X,
} from "lucide-react";
import { Section, Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge, PodiumBadge } from "@/components/ui/Badges";
import { cn, formatDate } from "@/lib/utils";
import type { ParticipantBasic, Activity, Invitacion } from "@/lib/types";
import { PlayerHistoryModal } from "@/app/_components/PlayerHistoryModal";


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
  { key: "total", label: "Puntos", Icon: Award, cols: 2 },
  { key: "acts", label: "Asist.", Icon: ClipboardList, cols: 1 },
] as const;

type RankingMetricKey = (typeof RANKING_METRICS)[number]['key'];

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
    "bg-white rounded-xl p-3 flex items-center gap-3 border relative overflow-hidden",
    pos <= 3 ? "border-primary/30" : "border-surface-dark",
    isClickable && "w-full text-left cursor-pointer transition-all hover:border-primary/40 active:scale-[0.99]",
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
      <Avatar p={p} size={36} />
      <div className="flex-1 z-10 min-w-0">
        <div className="font-bold truncate">
          {p.nombre} {p.apellido}
        </div>
        <div className="text-xs mt-1 flex gap-2 flex-wrap">
          <span className="text-text-muted">{p.acts} act.</span>
          {p.gf > 0 && (
            <span className="text-text-muted font-bold">{p.gf}</span>
          )}
          {p.gh > 0 && (
            <span className="text-text-muted font-bold">{p.gh}</span>
          )}
          {p.gb > 0 && (
            <span className="text-text-muted font-bold">{p.gb}</span>
          )}
        </div>
      </div>
      <div className="font-black text-2xl z-10">{metricValue}</div>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>{content}</div>
  );
}

export default function Page() {
  const { db, isLoading, showSettings, setShowSettings, logout } = useApp();
  const { participants, activities, rankings } = db;
  const role = useStore($role);
  const router = useRouter();

  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [showInvitaciones, setShowInvitaciones] = useState(false);
  const [rankingMetric, setRankingMetric] = useState<RankingMetricKey>('total');
  const [selectedInviter, setSelectedInviter] = useState<InvitacionRanking | null>(null);
  const [selectedRankingPlayer, setSelectedRankingPlayer] = useState<RankingWithStats | null>(null);

  const handleActivityClick = (activityId: number) => {
    router.push(`/activities/${activityId}`);
  };

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
      .map((p) => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);

    const allScorers = calculatedRankings
      .map((p) => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
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
      totalPartidos: (activities || []).reduce(
        (acc, a) => acc + (a.partidos || []).length,
        0,
      ),
    };
  }, [calculatedRankings, participants, activities]);

  const lastActs = useMemo(
    () =>
      [...activities]
        .sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )
        .slice(0, 2),
    [activities],
  );

  const invitacionRanking = useMemo(() => {
    const counts: Record<number, { total: number; invitaciones: { inv: Invitacion; activity: Activity }[] }> = {};

    (activities || []).forEach((act) => {
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
  }, [participants, activities]);

  const getInvitadosDetails = (invitaciones: { inv: Invitacion; activity: Activity }[]) => {
    return invitaciones
      .map((item) => {
        const invited = (participants || []).find((p) => p.id === item.inv.invitadoId);
        if (!invited) return null;
        return {
          invited,
          activity: item.activity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  if (isLoading) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-primary rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-accent">
                {activities.length}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Actividades
              </div>
            </div>
            <div className="bg-primary rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-accent">
                {stats.totalPlayers}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Jugadores
              </div>
            </div>
            <div className="bg-primary rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-accent">
                {stats.totalGoles}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Total Goles
              </div>
            </div>
          </div>

          <div
            className="flex justify-between items-center mb-4 cursor-pointer select-none"
            onClick={() => setShowTopGoleadores((prev) => !prev)}
          >
            <Section icon={Volleyball} title="Goleadores" />
            {showTopGoleadores ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </div>

          {showTopGoleadores && (
            <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
              <div className="flex flex-col gap-2">
                {stats.top3Scorers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-text-muted italic">
                    Aún no hay goles registrados
                  </div>
                ) : (
                  <>
                    {stats.top3Scorers.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-2 bg-surface-dark rounded-xl"
                      >
                        <PodiumBadge
                          pos={i + 1}
                          className="w-6 h-6 bg-white border-0 shadow-sm text-primary font-bold"
                        />
                        <Avatar p={p} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">
                            {p.nombre} {p.apellido}
                          </div>
                        </div>
                        <div className="font-black text-primary bg-white px-2 py-1 rounded-lg text-xs shadow-sm">
                          {p.goals}{" "}
                          <span className="text-[10px] opacity-50 font-bold">
                            goles
                          </span>
                        </div>
                      </div>
                    ))}
                    {stats.allScorers.length > 3 && (
                      <button
                        type="button"
                        onClick={() => router.push("/participants")}
                        className="flex items-center justify-end gap-1 text-xs font-bold text-primary mt-1"
                      >
                        Ver ranking completo <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div
            className="flex justify-between items-center mb-4 cursor-pointer select-none"
            onClick={() => setShowRanking((prev) => !prev)}
          >
            <Section icon={Trophy} title="Ranking Individual" />
            {showRanking ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </div>

          {showRanking && (
            <>
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
                          ? "bg-primary text-white shadow-md"
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
                <div className="flex flex-col gap-2 mb-4">
                  {calculatedRankings.slice(0, 5).map((p, i) => (
                    <RankRow
                      key={p.id}
                      p={p}
                      pos={i + 1}
                      metric={rankingMetric}
                      isClickable={rankingMetric === "total"}
                      onClick={rankingMetric === "total" ? () => setSelectedRankingPlayer(p) : undefined}
                    />
                  ))}
                  {calculatedRankings.length > 5 && (
                    <button
                      type="button"
                      onClick={() => router.push("/participants")}
                      className="flex items-center justify-end gap-1 text-xs font-bold text-primary mt-1"
                    >
                      Ver ranking completo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          <div
            className="flex justify-between items-center mb-4 cursor-pointer select-none"
            onClick={() => setShowInvitaciones((prev) => !prev)}
          >
            <Section icon={Users} title="Invitaciones" />
            {showInvitaciones ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </div>

          {showInvitaciones && (
            <>
              {invitacionRanking.length === 0 ? (
                <Empty text="No hay invitaciones registradas" />
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {invitacionRanking.slice(0, 3).map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedInviter(p)}
                      className={cn(
                        "bg-white rounded-xl p-3 flex items-center gap-3 border cursor-pointer hover:bg-surface-dark transition-colors",
                        i <= 2 ? "border-primary/30" : "border-surface-dark",
                      )}
                    >
                      <RankBadge pos={i + 1} />
                      <Avatar p={p} size={36} />
                      <div className="flex-1 z-10 min-w-0">
                        <div className="font-bold truncate">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="font-black text-2xl z-10">
                        {p.invitedCount}
                        <span className="text-xs font-bold text-text-muted ml-1">
                          inv.
                        </span>
                      </div>
                    </div>
                  ))}
                  {invitacionRanking.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowInvitaciones(true)}
                      className="flex items-center justify-end gap-1 text-xs font-bold text-primary mt-1"
                    >
                      Ver ranking completo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {lastActs.length > 0 && (
            <>
              <Section icon={Calendar} title="Últimas Actividades" />
              <div className="flex flex-col gap-2 mb-4">
                {lastActs.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleActivityClick(a.id)}
                    className={cn(
                      "bg-white rounded-xl p-4 border border-surface-dark flex justify-between",
                      "cursor-pointer",
                    )}
                  >
                    <div>
                      <div className="font-bold">
                        {a.titulo || formatDate(a.fecha)}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {formatDate(a.fecha)} · {a.asistentes.length} presentes
                      </div>
                    </div>
                    <div className="text-sm text-primary font-bold">
                      {a.juegos.length} juegos
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedRankingPlayer && (
        <PlayerHistoryModal
          player={selectedRankingPlayer}
          activities={activities}
          participants={participants}
          onClose={() => setSelectedRankingPlayer(null)}
        />
      )}

      {selectedInviter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-bold">
                  {selectedInviter.nombre} {selectedInviter.apellido}
                </div>
                <div className="text-sm text-text-muted">
                  {selectedInviter.invitedCount} invitados
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedInviter(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-2">
                {getInvitadosDetails(selectedInviter.invitaciones).map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 bg-surface-dark rounded-xl"
                  >
                    <Avatar p={detail.invited} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {detail.invited.nombre} {detail.invited.apellido}
                      </div>
                      {detail.activity && (
                        <div className="text-xs text-text-muted truncate">
                          {detail.activity.titulo || formatDate(detail.activity.fecha)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
