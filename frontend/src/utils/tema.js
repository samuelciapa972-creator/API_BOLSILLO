export const CLAVE_TEMA = "bolsillo.tema";

export const leerTema = () => {
  try {
    return localStorage.getItem(CLAVE_TEMA) || "sistema";
  } catch {
    return "sistema";
  }
};

// Preferencia por visitante: sin almacenamiento disponible, sigue al sistema.
export const aplicarTema = (tema) => {
  const raiz = document.documentElement;
  if (tema === "claro") raiz.dataset.theme = "light";
  else if (tema === "oscuro") raiz.dataset.theme = "dark";
  else delete raiz.dataset.theme;
};

export const temaInicial = () => aplicarTema(leerTema());
