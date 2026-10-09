"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/hooks/useApp";
import { MotionConfig } from "framer-motion";
import {
  ChevronLeft,
  Award,
  ClipboardList,
  Check,
} from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { GroupedList } from "@/components/ui/GroupedList";
import {
  CountUp,
  EmptyBlock,
  LeaderRow,
  Reveal,
  SectionTitle,
  SegmentedControl,
} from "@/app/_components/home-ui";
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

const RANKING_METRICS = [
  { key: "total", label: "Puntos", Icon: Award },
  { key: "acts", label: "Asist.", Icon: ClipboardList },
] as const;

type RankingMetricKey = (typeof RANKING_METRICS)[number]["key"];

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

  // The home podium is always by points: calculatedRankings follows the sheet's metric selector
  const topByPoints = useMemo(
    () =>
      [...calculatedRankings]
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, 3),
    [calculatedRankings],
  );

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
    <MotionConfig reducedMotion="user">
      <div className="p-4">
        {/* Totals */}
        <Reveal index={0} className="mb-8">
          <div className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border bg-card py-5">
            {[
              { label: "Actividades", value: activities.length },
              { label: "Jugadores", value: stats.totalPlayers },
              { label: "Total Goles", value: stats.totalGoles },
            ].map((item) => (
              <div key={item.label} className="px-2 text-center">
                <CountUp
                  value={item.value}
                  className="block text-4xl font-black tracking-tight text-foreground"
                />
                <div className="mt-1 text-xs font-bold text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ─── GOLEADORES ─── */}
        <Reveal index={1} className="mb-8">
          <SectionTitle title="Goleadores" onOpen={() => setGoleadoresOpen(true)} />
          {stats.top3Scorers.length === 0 ? (
            <EmptyBlock text="Aún no hay goles registrados" />
          ) : (
            <GroupedList>
              {stats.top3Scorers.map((p, i) => (
                <LeaderRow
                  key={p.id}
                  p={p}
                  pos={i + 1}
                  value={p.goals}
                  unit={p.goals === 1 ? "gol" : "goles"}
                  max={stats.top3Scorers[0].goals}
                />
              ))}
            </GroupedList>
          )}
        </Reveal>

        {/* ─── PUNTAJE ─── */}
        <Reveal index={2} className="mb-8">
          <SectionTitle title="Puntaje" onOpen={() => setRankingOpen(true)} />
          {topByPoints.length === 0 ? (
            <EmptyBlock text="Aún no hay participantes" />
          ) : (
            <GroupedList>
              {topByPoints.map((p, i) => (
                <LeaderRow
                  key={p.id}
                  p={p}
                  pos={i + 1}
                  value={p.total || 0}
                  unit="pts"
                  max={topByPoints[0].total || 0}
                />
              ))}
            </GroupedList>
          )}
        </Reveal>

        {/* ─── INVITACIONES ─── */}
        <Reveal index={3} className="mb-8">
          <SectionTitle title="Invitaciones" onOpen={() => setInvitacionesOpen(true)} />
          {invitacionRanking.length === 0 ? (
            <EmptyBlock text="No hay invitaciones registradas" />
          ) : (
            <GroupedList>
              {invitacionRanking.slice(0, 3).map((p, i) => (
                <LeaderRow
                  key={p.id}
                  p={p}
                  pos={i + 1}
                  value={p.invitedCount}
                  unit={p.invitedCount === 1 ? "invitado" : "invitados"}
                  max={invitacionRanking[0].invitedCount}
                />
              ))}
            </GroupedList>
          )}
        </Reveal>
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
          <GroupedList>
            {stats.allScorers.map((p, i) => (
              <LeaderRow
                key={p.id}
                p={p}
                pos={i + 1}
                value={p.goals}
                unit={p.goals === 1 ? "gol" : "goles"}
                max={stats.allScorers[0].goals}
              />
            ))}
          </GroupedList>
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
            <SegmentedControl
              id="ranking-metric"
              value={rankingMetric}
              onChange={setRankingMetric}
              options={RANKING_METRICS.map((metric) => ({
                key: metric.key,
                label: metric.label,
                Icon: metric.Icon,
              }))}
            />

            {calculatedRankings.length === 0 ? (
              <Empty text="Aún no hay participantes" />
            ) : (
              <GroupedList>
                {calculatedRankings.map((p, i) => (
                  <LeaderRow
                    key={p.id}
                    p={p}
                    pos={i + 1}
                    value={p[rankingMetric] || 0}
                    unit={rankingMetric === "total" ? "pts" : "asist."}
                    max={calculatedRankings[0][rankingMetric] || 0}
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
              </GroupedList>
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
          <GroupedList>
            {invitacionRanking.map((p, i) => (
              <LeaderRow
                key={p.id}
                p={p}
                pos={i + 1}
                value={p.invitedCount}
                unit={p.invitedCount === 1 ? "invitado" : "invitados"}
                max={invitacionRanking[0].invitedCount}
                onClick={() => {
                  setInvitacionesOpen(false);
                  setSelectedInviter(p);
                }}
              />
            ))}
          </GroupedList>
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
          <GroupedList>
            {getInvitadosDetails(selectedInviter.invitaciones).map(
              (detail, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Avatar p={detail.invited} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold leading-tight text-foreground">
                      {detail.invited.nombre} {detail.invited.apellido}
                    </div>
                    {detail.activity && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {detail.activity.titulo ||
                          formatDate(detail.activity.fecha)}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </GroupedList>
        </DetailSheet>
      )}
    </MotionConfig>
  );
}
