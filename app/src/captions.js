// Golden Hour — Cover Studio: inline-editable captions and draggable
// callouts.
//
// Any element with [data-edit] becomes editable in place: click to
// type, Enter or blur to save, Escape to cancel. Callouts are free
// text pinned to the cover by percentage coordinates and moved by
// dragging them.

export function makeEditable(el, onSave) {
  el.contentEditable = 'true';
  el.spellcheck = false;
  let before = '';
  el.addEventListener('focus', () => {
    before = el.textContent;
  });
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      el.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      el.textContent = before;
      el.blur();
    }
  });
  el.addEventListener('blur', () => {
    const text = el.textContent.trim();
    if (text.length === 0) {
      el.textContent = before;
      return;
    }
    onSave(text);
  });
}

// Build the callout elements inside the cover overlay. Each callout
// drags with the pointer; its position is stored as a percentage of
// the cover so it survives resizes and exports.
export function buildCallouts(layer, state, onMove) {
  const els = state.callouts.map((callout, i) => {
    const el = document.createElement('div');
    el.className = 'callout';
    el.dataset.index = String(i);
    el.textContent = callout.text;
    el.style.left = `${callout.x}%`;
    el.style.top = `${callout.y}%`;
    makeEditable(el, (text) => {
      state.callouts[i].text = text;
    });
    el.addEventListener('pointerdown', (event) => {
      if (document.activeElement === el) return; // editing, not dragging
      event.preventDefault();
      event.stopPropagation();
      const cover = layer.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const baseX = callout.x;
      const baseY = callout.y;
      el.setPointerCapture(event.pointerId);
      const onPointerMove = (moveEvent) => {
        const dx = ((moveEvent.clientX - startX) / cover.width) * 100;
        const dy = ((moveEvent.clientY - startY) / cover.height) * 100;
        callout.x = Math.max(0, Math.min(88, Math.round((baseX + dx) * 10) / 10));
        callout.y = Math.max(0, Math.min(92, Math.round((baseY + dy) * 10) / 10));
        el.style.left = `${callout.x}%`;
        el.style.top = `${callout.y}%`;
      };
      const onPointerUp = () => {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);
        onMove(i, callout);
      };
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
    });
    layer.appendChild(el);
    return el;
  });
  return els;
}

export function renderCallouts(els, state) {
  els.forEach((el, i) => {
    const callout = state.callouts[i];
    if (document.activeElement !== el) el.textContent = callout.text;
    el.style.left = `${callout.x}%`;
    el.style.top = `${callout.y}%`;
  });
}
