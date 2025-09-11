export interface AnimationWindow {
  introMs: number; // default 150–200
}

function secs(ms: number): number { return ms / 1000; }

export function buildLineIntroFilters(params: {
  styleAnimation: 'fade' | 'bounce' | 'pop' | 'glitch';
  startSec: number;
  endSec: number;
  baseXExpr: string; // např. "(w-text_w)/2"
  baseYExpr: string; // spočtené z layoutu
  fontSize: number;
  window?: AnimationWindow;
}): { filters: string[]; preLayers?: string[] } {
  const { styleAnimation, startSec, baseXExpr, baseYExpr, fontSize, window } = params;
  const intro = secs(window?.introMs ?? 180);
  const t0 = startSec.toFixed(2);
  const t1 = (startSec + intro).toFixed(2);

  // Jednoduché varianty přímou manipulací parametrů drawtextu.
  if (styleAnimation === 'fade') {
    // Alpha ramp během intro okna (simulovaně přes fontcolor alpha)
    const alpha = `if(lt(t,${t1}),(t-${t0})/${intro.toFixed(2)},1)`;
    return { filters: [`fontcolor_expr='a=${alpha}'`] };
  }

  if (styleAnimation === 'bounce') {
    // Vertikální offset v prvních ~200ms
    const yExpr = `${baseYExpr}+if(between(t,${t0},${t1}),-3,0)`;
    return { filters: [`y=${yExpr}`] };
  }

  if (styleAnimation === 'pop') {
    // Y offset -2px + alpha ramp (same as fade)
    const yExpr = `${baseYExpr}+if(between(t,${t0},${t1}),-2,0)`;
    const alpha = `if(lt(t,${t1}),(t-${t0})/${intro.toFixed(2)},1)`;
    return { filters: [`y=${yExpr}`, `fontcolor_expr='a=${alpha}'`] };
  }

  if (styleAnimation === 'glitch') {
    // Krátké horizontální jitter (±2px)
    const xExpr = `${baseXExpr}+if(between(t,${t0},${t1}),2,0)`;
    return { filters: [`x=${xExpr}`] };
  }

  return { filters: [] };
}



