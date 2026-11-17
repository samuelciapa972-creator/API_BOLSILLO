# Bolsillo · Dirección visual

Dirección elegida por el equipo (17/11/2026): **base neutra + un solo color de marca**, como una app bancaria real. Reemplaza a la primera dirección "Libreta de ahorro" (papel crema, tinta verde, cobre y cifras con serif), que el equipo descartó porque se veía genérica.

## Por qué cada decisión

| Decisión | Valor | Razón |
|---|---|---|
| Fondo | gris muy claro `#F6F6F8`, tarjetas blancas | Neutro: el dinero y las acciones son lo único que llama la atención. |
| Texto | casi negro `#16161A` | Contraste alto sin el negro puro. |
| Marca | morado `#6A2CF5` | Único color de marca: botón principal, navegación activa y **bolsillos**. Texto blanco sobre morado: contraste 7:1. |
| Entradas / salidas | verde `#0E7A46` / rojo `#C62A22` | Solo para el sentido de los montos; nunca decorativos. |
| Tipografía | Inter (variable) para todo | Una sola familia. Los saldos van en Inter 700 con `tabular-nums` y tracking negativo, como en las apps de banca. |
| Radio | 10 px controles · 14 px tarjetas · 18 px diálogos | Suave y actual, sin llegar a píldoras. |
| Profundidad | bordes de 1 px + sombra mínima | Una sola elevación; el diálogo es lo único que flota. |
| Modo oscuro | fondo `#0E0E11`, morado aclarado `#A78BFA` | Mismo sistema; solo cambia la luz. |
| Movimiento | hover, foco, entrada de página (240 ms), hoja deslizable (320 ms), indicador de navegación con resorte sin rebote, saldo que cuenta solo cuando cambia por un movimiento | Cada animación explica un cambio de estado. Respeta `prefers-reduced-motion`. |

## Firma

**La barra de saldo partida**: el saldo total como una barra donde el tramo oscuro es lo disponible y cada bolsillo ocupa un tramo morado. Refleja la regla central del negocio:
`saldo disponible = saldo total − suma de bolsillos activos`.

## Lo que se evita a propósito

- Papel crema, tonos tierra y cifras con serif: la combinación típica de interfaces generadas.
- Degradados, sombras de color y efectos de vidrio.
- Tarjetas de métricas idénticas en cuadrícula: el panel tiene un solo foco (el saldo).
- Logos o avatares inventados: la marca es la palabra "Bolsillo" y los avatares son iniciales.
