import { createContext, useContext, useMemo, useState } from "react";
import { getActorKey, setActorKey } from "../services/api.js";

const ACTORS = [
  { key: "demo-citizen", label: "Citizen", role: "CITIZEN" },
  { key: "demo-inspector", label: "Inspector", role: "INSPECTOR" },
  { key: "demo-admin", label: "Administrator", role: "ADMIN" },
];

const ActorContext = createContext(null);

export function ActorProvider({ children }) {
  const [actorKey, setKey] = useState(getActorKey());
  const actor = ACTORS.find((a) => a.key === actorKey) || ACTORS[0];
  const value = useMemo(
    () => ({
      actor,
      actors: ACTORS,
      isAdmin: actor.role === "ADMIN",
      isStaff: actor.role === "ADMIN" || actor.role === "INSPECTOR",
      setActor: (key) => {
        setActorKey(key);
        setKey(key);
      },
    }),
    [actor, actorKey]
  );
  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor() {
  return useContext(ActorContext);
}
