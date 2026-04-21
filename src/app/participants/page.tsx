"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  PartyPopper,
  Calendar,
} from "lucide-react";
import { getEdad } from "@/lib/constants";
import { PageHeader, Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Page() {
  const router = useRouter();
  const { db, saveParticipant, deleteParticipant, refresh } = useApp();
  const { participants, activities, rankings } = db;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterSex, setFilterSex] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jugadorAEliminar, setJugadorAEliminar] = useState<any>(null);
  const [confirmName, setConfirmName] = useState("");

  // Get role from store
  const role = useStore($role);
  const isAdmin = role === "admin";

  // En mobile siempre lista, en desktop usa el estado
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const effectiveViewMode = isDesktop ? viewMode : "list";

  const list = useMemo(() => {
    let result = (participants || []).map((p) => {
      const r = (rankings || []).find((x) => x.id === p.id) || {
        total: 0,
        gf: 0,
        gh: 0,
        gb: 0,
        acts: 0,
      };
      return { ...p, ...r };
    });

    if (search) {
      result = result.filter((p) =>
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }

    if (filterSex !== "all") {
      result = result.filter((p) => p.sexo === filterSex);
    }

    result.sort((a, b) => {
      if (sortBy === "nombre") {
        const valA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const valB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (sortBy === "apellido") {
        const valA = `${a.apellido} ${a.nombre}`.toLowerCase();
        const valB = `${b.apellido} ${b.nombre}`.toLowerCase();
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      const valA = a[sortBy] || 0;
      const valB = b[sortBy] || 0;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [participants, activities, search, sortBy, sortOrder, filterSex]);

  const del = (id: number) => {
    const jugador = (participants || []).find((p) => p.id === id);
    if (!jugador) return;
    setJugadorAEliminar(jugador);
    setConfirmName("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmName.trim() === "Confirmar") {
      await deleteParticipant(jugadorAEliminar.id);
      setDeleteDialogOpen(false);
      setJugadorAEliminar(null);
      setConfirmName("");
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Componente de card para vista grid
  function PlayerCard({ p }: { p: any }) {
    return (
      <div
        onClick={() => router.push(`/participants/${p.id}`)}
        className="group bg-surface rounded-xl p-4 border border-surface-dark cursor-pointer hover:border-primary/30 transition-colors relative"
      >
        <div className="flex items-start gap-3">
          <Avatar p={p} size={56} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{p.nombre}</div>
            <div className="font-bold text-sm truncate">{p.apellido}</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>{getEdad(p.fechaNacimiento)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{p.acts}</span>
              </div>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => router.push(`/participants/${p.id}/edit`)}
              variant="outline"
              size="icon"
              className="text-primary h-7 w-7 bg-white/90 hover:bg-white"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => del(p.id)}
              variant="destructive"
              size="icon"
              className="h-7 w-7 bg-white/90 hover:bg-white"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Jugadores"
        sub={`${(participants || []).length} registrados`}
      />
      <div className="p-4">
        {isAdmin && (
          <Button
            onClick={() => router.push("/participants/new")}
            className="w-full mb-3"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Agregar Jugador
          </Button>
        )}

        <div className="relative mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Select value={filterSex} onValueChange={setFilterSex}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Varón</SelectItem>
              <SelectItem value="F">Mujer</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-1 gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="apellido">Apellido</SelectItem>
                <SelectItem value="total">Puntos</SelectItem>
                <SelectItem value="gf">Goles Fútbol</SelectItem>
                <SelectItem value="gh">Goles Handball</SelectItem>
                <SelectItem value="gb">Goles Básquet</SelectItem>
                <SelectItem value="acts">Asistencias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-1"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              aria-label="Invertir orden"
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </Button>
            {/* Toggle vista solo visible en desktop */}
            <div className="hidden md:flex bg-surface-dark rounded-lg p-1 gap-1 ml-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  effectiveViewMode === "list"
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-muted hover:text-foreground"
                }`}
                aria-label="Vista lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  effectiveViewMode === "grid"
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-muted hover:text-foreground"
                }`}
                aria-label="Vista grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <Empty text="No hay jugadores" />
        ) : effectiveViewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {list.map((p) => (
              <PlayerCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => {
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/participants/${p.id}`)}
                  className="bg-white rounded-xl p-3 border border-surface-dark flex items-center gap-3 cursor-pointer hover:border-primary/30"
                >
                  <Avatar p={p} size={48} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {p.nombre} {p.apellido}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <PartyPopper className="w-3.5 h-3.5" />
                        <span>{getEdad(p.fechaNacimiento)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{p.acts}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && (
                      <>
                        <Button
                          onClick={() =>
                            router.push(`/participants/${p.id}/edit`)
                          }
                          variant="outline"
                          size="icon"
                          className="text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => del(p.id)}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar a{" "}
              <span className="font-semibold text-foreground">
                {jugadorAEliminar
                  ? `${jugadorAEliminar.nombre} ${jugadorAEliminar.apellido}`
                  : ""}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Escribí Confirmar"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={confirmName.trim() !== "Confirmar"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
