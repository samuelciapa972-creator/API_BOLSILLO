import { useSyncExternalStore } from "react";
import { obtenerTema, suscribirTema } from "../utils/tema";

export const useTema = () => useSyncExternalStore(suscribirTema, obtenerTema, obtenerTema);
