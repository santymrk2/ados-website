"use client";

import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { SettingsPanel } from "@/components/auth/SettingsPanel";
import {
  Settings,
  Trophy,
  Volleyball,
  Calendar,
  ChevronDown,
  ChevronUp,
  Award,
  ClipboardList,
  Users,
  X,
} from "lucide-react";
import { Section, Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { RankBadge, PodiumBadge } from "@/components/ui/Badges";
import { cn, formatDate } from "@/lib/utils";
import type { ParticipantBasic, Activity, Ranking, Invitacion } from "@/lib/types";

// Tipo para ranking calculado con stats
interface RankingWithStats extends ParticipantBasic {
  total: number;
  gf: number;
  gh: number;
  gb: number;
  acts: number;
  goals?: number;
}

// Tipo para ranking de invitaciones
interface InvitacionWithActivity {
  inv: Invitacion;
  activity: Activity;
}

interface InvitacionRanking extends ParticipantBasic {
  invitedCount: number;
  invitaciones: InvitacionWithActivity[];
}

// Tipo para stats del dashboard
interface DashboardStats {
  jugadoresActivos: number;
  porcentajeActivos: number;
  totalGoles: number;
  totalPlayers: number;
  masGoles: { f: number; h: number; b: number };
  totalPartidos: number;
  top5ScorersM: RankingWithStats[];
  top5ScorersF: RankingWithStats[];
  maleCount: number;
  femaleCount: number;
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
}: {
  p: RankingWithStats;
  pos: number;
  activities: Activity[];
  metric: RankingMetricKey;
}) {
  const metricValue = p[metric] || 0;

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-3 flex items-center gap-3 border relative overflow-hidden",
        pos <= 3 ? "border-primary/30" : "border-surface-dark",
      )}
    >
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
    </div>
  );
}

export default function Page() {
  const { db, showSettings, setShowSettings, refresh, logout } = useApp();
  const { participants, activities, rankings } = db;
  const role = useStore($role);
  const router = useRouter();

  const [showRanking, setShowRanking] = useState(false);
  const [showTopGoleadores, setShowTopGoleadores] = useState(false);
  const [showInvitaciones, setShowInvitaciones] = useState(false);
  const [topGoleadoresGender, setTopGoleadoresGender] = useState<'M' | 'F' | null>('M');
  const [rankingMetric, setRankingMetric] = useState<RankingMetricKey>('total');
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [selectedInviter, setSelectedInviter] = useState<InvitacionRanking | null>(null);

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

    const masGoles = {
      f: (activities || []).reduce(
        (acc, a) =>
          acc +
          (a.goles || [])
            .filter((g) => g.tipo === "f")
            .reduce((s, g) => s + g.cant, 0),
        0,
      ),
      h: (activities || []).reduce(
        (acc, a) =>
          acc +
          (a.goles || [])
            .filter((g) => g.tipo === "h")
            .reduce((s, g) => s + g.cant, 0),
        0,
      ),
      b: (activities || []).reduce(
        (acc, a) =>
          acc +
          (a.goles || [])
            .filter((g) => g.tipo === "b")
            .reduce((s, g) => s + g.cant, 0),
        0,
      ),
    };

    const top5ScorersM = calculatedRankings
      .filter((p) => p.sexo === "M")
      .map((p) => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    const top5ScorersF = calculatedRankings
      .filter((p) => p.sexo === "F")
      .map((p) => ({ ...p, goals: (p.gf || 0) + (p.gh || 0) + (p.gb || 0) }))
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    const maleCount = (participants || []).filter((p) => p.sexo === "M").length;
    const femaleCount = (participants || []).filter(
      (p) => p.sexo === "F",
    ).length;

    return {
      jugadoresActivos,
      porcentajeActivos: participants.length
        ? Math.round((jugadoresActivos / participants.length) * 100)
        : 0,
      totalGoles,
      totalPlayers,
      masGoles,
      totalPartidos: (activities || []).reduce(
        (acc, a) => acc + (a.partidos || []).length,
        0,
      ),
      top5ScorersM,
      top5ScorersF,
      maleCount,
      femaleCount,
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

  const topScorers = useMemo(() => {
    if (topGoleadoresGender === "M") return stats.top5ScorersM;
    if (topGoleadoresGender === "F") return stats.top5ScorersF;
    // Ambos: merge y top 5
    return [...stats.top5ScorersM, ...stats.top5ScorersF]
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [topGoleadoresGender, stats.top5ScorersM, stats.top5ScorersF]);

  // Por defecto, si no hay actividades seleccionadas, mostrar todas
  const activeActivityIds = selectedActivityIds.length > 0
    ? selectedActivityIds
    : (activities || []).map((a) => a.id);

  // Calcular ranking de invitaciones basado en actividades seleccionadas
  const invitacionRanking = useMemo(() => {
    const counts: Record<number, { total: number; invitaciones: { inv: Invitacion; activity: Activity }[] }> = {};

    (activities || []).forEach((act) => {
      if (!activeActivityIds.includes(act.id)) return;
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
  }, [participants, activities, activeActivityIds]);

  // Obtener los invitados de una persona específica
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

  return (
    <>
      <div>
        <div className="bg-primary pt-safe">
          <div className="text-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div
                  className="text-2xl font-black tracking-tight"
                  style={{ fontFamily: "ClashGrotesk, sans-serif" }}
                >
                  ACTIVADOS
                </div>
                <h1 className="text-lg font-bold mt-1 opacity-80">Dashboard</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {activities.length}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Actividades
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.totalPlayers}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Total Jugadores
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.maleCount}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Varones
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.femaleCount}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Mujeres
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div
            className="flex justify-between items-center mb-4 cursor-pointer select-none"
            onClick={() => setShowTopGoleadores((prev) => !prev)}
          >
            <Section icon={Volleyball} title="Goleadores Fútbol" />
            {showTopGoleadores ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </div>

          {showTopGoleadores && (
            <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
              <div className="flex gap-2 mb-4">
                {[
                  { val: null, label: "Ambos" },
                  { val: "M", label: "Varón" },
                  { val: "F", label: "Mujer" },
                ].map((t) => (
                  <Button
                    key={t.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopGoleadoresGender(t.val as 'M' | 'F' | null)}
                    className={cn(
                      "flex-1 border-2 transition-all",
                      topGoleadoresGender === t.val
                        ? "bg-primary text-white font-black border-primary"
                        : "text-text-muted border-surface-dark",
                    )}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {topScorers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-text-muted italic">
                    Aún no hay goles registrados
                  </div>
                ) : (
                  topScorers.map((p, i) => (
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
                  ))
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
                  {calculatedRankings.slice(0, 10).map((p, i) => (
                    <RankRow
                      key={p.id}
                      p={p}
                      pos={i + 1}
                      activities={activities}
                      metric={rankingMetric}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Sección Invitaciones */}
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
              {/* Checklist de actividades */}
              <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
                <div className="text-xs font-bold text-text-muted mb-2">
                  Filtrar por actividades:
                </div>
                <div className="flex flex-wrap gap-2">
                  {(activities || []).map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        setSelectedActivityIds((prev) =>
                          prev.includes(act.id)
                            ? prev.filter((id) => id !== act.id)
                            : [...prev, act.id],
                        );
                      }}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                        selectedActivityIds.length === 0 || selectedActivityIds.includes(act.id)
                          ? "bg-primary text-white"
                          : "bg-surface-dark text-text-muted",
                      )}
                    >
                      {act.titulo || formatDate(act.fecha)}
                    </button>
                  ))}
                </div>
                {selectedActivityIds.length === 0 && (
                  <div className="text-xs text-text-muted mt-2 italic">
                    (Mostrando todas las actividades)
                  </div>
                )}
              </div>

              {/* Ranking de invitaciones */}
              {invitacionRanking.length === 0 ? (
                <Empty text="No hay invitaciones registradas" />
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {invitacionRanking.slice(0, 10).map((p, i) => (
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
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={logout}
        role={role}
      />

      {/* Modal de invitados */}
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
