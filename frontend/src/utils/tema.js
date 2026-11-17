// Preferencia de tema por visitante, compartida entre el selector y el Toaster.
export const CLAVE_TEMA = "bolsillo.tema";
const SIGUIENTE = { sistema: "claro", claro: "oscuro", oscuro: "sistema" };
const suscriptores = new Set();

export const leerTema = () => {
  try {
    return localStorage.getItem(CLAVE_TEMA) || "sistema";
  } catch {
    return "sistema";
  }
};

let actual = leerTema();

export const aplicarTema = (tema) => {
  const raiz = document.documentElement;
  if (tema === "claro") raiz.dataset.theme = "light";
  else if (tema === "oscuro") raiz.dataset.theme = "dark";
  else delete raiz.dataset.theme;
};

export const temaInicial = () => aplicarTema(actual);

export const obtenerTema = () => actual;

export const suscribirTema = (fn) => {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
};

export const rotarTema = () => {
  actual = SIGUIENTE[actual] || "sistema";
  aplicarTema(actual);
  try {
    localStorage.setItem(CLAVE_TEMA, actual);
  } catch {
    // Sin almacenamiento: dura hasta recargar.
  }
  suscriptores.forEach((fn) => fn());
};

// Para Sonner: "system" sigue al sistema operativo.
export const temaParaToaster = (tema) => (tema === "claro" ? "light" : tema === "oscuro" ? "dark" : "system");
