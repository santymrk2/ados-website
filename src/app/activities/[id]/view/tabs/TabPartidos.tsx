"use client";

import { useState } from "react";
import { DEPORTES, GENEROS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Common";
import type { Partido } from "@/lib/types";

export function TabPartidos({ partidos }: { partidos: Partido[] }) {
    const [filterGenero, setFilterGenero] = useState("all");
    const filtered = partidos.filter(
        (p) => filterGenero === "all" || p.genero === filterGenero,
    );
    const byDeporte: Record<string, Partido[]> = {};
    filtered.forEach((p) => {
        const group = p.deporte || "otro";
        if (!byDeporte[group]) byDeporte[group] = [];
        byDeporte[group].push(p);
    });
    return (
        <div>
            <div className="flex gap-2 mb-4">
                {[
                    { val: "all", label: "Todos", activeBg: "bg-primary" },
                    { val: "M", label: "Masculino", activeBg: "bg-blue-500" },
                    { val: "F", label: "Femenino", activeBg: "bg-pink-500" },
                ].map(({ val, label, activeBg }) => (
                    <Button
                        key={val}
                        onClick={() => setFilterGenero(val)}
                        variant={filterGenero === val ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 rounded-xl font-bold text-xs ${
                            filterGenero === val
                                ? activeBg
                                : "bg-white/20 text-white border-white/30"
                        }`}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <Empty text="Sin partidos" />
            ) : (
                Object.entries(byDeporte).map(([deporte, matches]) => {
                    return (
                        <div key={deporte} className="mb-6">
                            <div className="font-bold text-sm text-white/70 mb-3">
                                {DEPORTES[deporte] || deporte}
                            </div>
                            {matches.map((p) => (
                                <PartidoReadOnlyCard key={p.id} partido={p} />
                            ))}
                        </div>
                    );
                })
            )}
        </div>
    );
}

function PartidoReadOnlyCard({ partido }: { partido: Partido }) {
    const isEmpate = partido.resultado === "E";
    const isEq1Win = parseInt(partido.resultado || "0") > 0;
    const isEq2Win = parseInt(partido.resultado || "0") < 0;
    const TeamBox = ({ eq, isWinner, result }: { eq: string; isWinner: boolean; result: number }) => (
        <div
            className="flex-1 rounded-lg p-3 text-center border-2"
            style={{
                backgroundColor: isWinner ? getTeamBg(eq) : "#f5f5f5",
                color: isWinner ? TEAM_COLORS[eq] : "#999",
                boxShadow: isWinner
                    ? `inset 0 0 20px ${TEAM_COLORS[eq]}20, 0 0 20px ${TEAM_COLORS[eq]}44`
                    : "none",
            }}
        >
            <div className="font-black text-lg">{eq}</div>
            <div className="text-2xl font-black mt-1">{result}</div>
        </div>
    );
    const resultStr =
        partido.resultado === "E" ? "0" : Math.abs(parseInt(partido.resultado || "0"));
    return (
        <div className="bg-white rounded-xl p-4 border border-surface-dark mb-3 overflow-hidden">
            <div className="font-bold text-xs text-text-muted mb-3 uppercase">
                {GENEROS.find((g) => g.val === partido.genero)?.label}
            </div>
            <div className="flex items-center gap-3">
                <TeamBox
                    eq={partido.eq1 || ""}
                    isWinner={isEq1Win}
                    result={
                        partido.resultado === "E"
                            ? 0
                            : Math.max(0, parseInt(partido.resultado || "0"))
                    }
                />
                <div className="text-center flex-shrink-0">
                    <div className="font-black text-sm text-text-muted">VS</div>
                </div>
                <TeamBox
                    eq={partido.eq2 || ""}
                    isWinner={isEq2Win}
                    result={
                        partido.resultado === "E"
                            ? 0
                            : Math.max(0, -parseInt(partido.resultado || "0"))
                    }
                />
            </div>
        </div>
    );
}