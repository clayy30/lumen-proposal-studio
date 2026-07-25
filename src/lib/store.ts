"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SAMPLE_PROJECTS } from "./sample-data";
import type { ProposalProject } from "./types";

const STORAGE_KEY = "lumen-proposal-studio:v1";

type StoreState = {
  projects: ProposalProject[];
  hydrated: boolean;
};

let memoryState: StoreState = {
  projects: SAMPLE_PROJECTS,
  hydrated: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readStorage(): ProposalProject[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projects?: ProposalProject[] };
    if (Array.isArray(parsed.projects) && parsed.projects.length) {
      return parsed.projects;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function writeStorage(projects: ProposalProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects }));
}

function getSnapshot(): StoreState {
  return memoryState;
}

function getServerSnapshot(): StoreState {
  return { projects: SAMPLE_PROJECTS, hydrated: false };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setProjects(projects: ProposalProject[]) {
  memoryState = { projects, hydrated: true };
  writeStorage(projects);
  emit();
}

export function useProjects() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (memoryState.hydrated) return;
    const stored = readStorage();
    memoryState = {
      projects: stored ?? SAMPLE_PROJECTS,
      hydrated: true,
    };
    emit();
  }, []);

  const upsertProjects = useCallback((incoming: ProposalProject[], mode: "merge" | "replace" = "merge") => {
    if (mode === "replace") {
      setProjects(incoming);
      return;
    }
    const map = new Map(memoryState.projects.map((p) => [p.id, p]));
    for (const p of incoming) {
      map.set(p.id, p);
    }
    setProjects(Array.from(map.values()));
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<ProposalProject>) => {
    setProjects(
      memoryState.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  const getProject = useCallback(
    (id: string) => memoryState.projects.find((p) => p.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.projects]
  );

  const resetSamples = useCallback(() => {
    setProjects(SAMPLE_PROJECTS);
  }, []);

  return {
    projects: state.projects,
    hydrated: state.hydrated,
    upsertProjects,
    updateProject,
    getProject,
    resetSamples,
  };
}

export function useProject(id: string) {
  const { projects, hydrated, updateProject } = useProjects();
  const [project, setProject] = useState<ProposalProject | undefined>();

  useEffect(() => {
    setProject(projects.find((p) => p.id === id));
  }, [projects, id]);

  return { project, hydrated, updateProject };
}
