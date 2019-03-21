import features from '../libs/features';
import React from 'dom-chef';
import select from 'select-dom';

async function init() {
  select.all('.branch-name').forEach(branch => {
    const pageContext = features.pageContext();
    branch.replaceWith(
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`${location.origin}/projects/${pageContext.projectKey}/repos/${
          pageContext.repoSlug
        }/browse?at=${branch.textContent}`}
      >
        {branch.textContent}
      </a>
    );
  });
}

features.add({
  id: 'pr-linkify-header-branches',
  include: [features.isPRDetails],
  load: features.onDomReady,
  init,
});
