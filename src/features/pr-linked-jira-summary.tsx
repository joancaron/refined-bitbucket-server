import React from 'dom-chef';
import features from '../libs/features';
import { prLinkedIssues } from '../libs/api';
import { waitForAjaxElement } from '../libs/dom-utils';
import select from 'select-dom';

async function init() {
  const selector = '.aui-group.details';

  await waitForAjaxElement(selector);

  if (select.exists('.rvb .linked-jira')) {
    return false;
  }

  const linkedIssues = await prLinkedIssues();

  const linkedIssuesHtml = linkedIssues.map(linkedIssue => {
    return (
      <li key={linkedIssue.key}>
        <img
          src={linkedIssue.fields.issuetype.iconUrl}
          alt={linkedIssue.fields.issuetype.name}
          className="aui-icon"
        />
        <a
          href="#"
          className="pull-request-issues-trigger multi-issues"
          data-issuekey={linkedIssue.key}
          original-title={linkedIssue.key}
        >
          {linkedIssue.key}
        </a>
        <span>: {linkedIssue.fields.summary}</span>
      </li>
    );
  });

  select(selector).parentElement.prepend(
    <ul className="linked-jira">{linkedIssuesHtml}</ul>
  );
}

features.add({
  id: 'pr-linked-jira-summary',
  include: [features.isPRDetailsOverview],
  load: features.onAjaxedPages,
  init,
});
