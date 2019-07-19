import features from '../libs/features';
import interact from 'interactjs';
import select from 'select-dom';

async function init() {
  interact('.aui-sidebar-wrapper')
    .resizable({
      edges: {
        top: false, // Use pointer coords to check for resize.
        left: false, // Disable resizing from left edge.
        bottom: false, // Resize if pointer target matches selector
        right: true, // Resize if pointer target is the given Element
      },
    })
    .on('resizemove', event => {
      let x = event.target.dataset;

      x = parseFloat(x) || 0;

      Object.assign(event.target.style, {
        width: `${event.rect.width}px`,
        transform: `translate(${event.deltaRect.left}px, ${event.deltaRect.top}px)`,
      });

      Object.assign(event.target.dataset, x);

      select(
        '.aui-sidebar~.aui-page-panel'
      ).style.paddingLeft = `${event.rect.width}px`;
    });
}

features.add({
  id: 'project-resizable-nav',
  include: [features.isProject],
  load: features.onDomReady,
  init,
});
