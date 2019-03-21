import features from '../libs/features';
async function init() {}

features.add({
  id: 'feature-template',
  include: [features.isPRDetailsDiff],
  load: features.onAjaxedPages,
  init,
});
