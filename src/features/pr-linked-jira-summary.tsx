import React from 'dom-chef';
import features from '../libs/features';
import {
  prLinkedIssues,
  getProjectVersions,
  getPullRequest,
  addVersionToTicket,
} from '../libs/api';
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
    const issueUrl = `/plugins/servlet/jira-integration/issues/${
      linkedIssue.key
    }`;
    return (
      <li key={linkedIssue.key}>
        <img
          src={linkedIssue.fields.issuetype.iconUrl}
          alt={linkedIssue.fields.issuetype.name}
          className="aui-icon"
        />
        <a
          href={issueUrl}
          className="pull-request-issues-trigger multi-issues"
          data-issue-keys={linkedIssue.key}
          data-initial-issue-key={linkedIssue.key}
          data-single-issue="true"
        >
          {linkedIssue.key}
        </a>
        <span>: {linkedIssue.fields.summary}</span>
      </li>
    );
  });

  const addVersionToTickets = async jiraBaseUrl => {
    const versionSelect = document.getElementById(
      'targetVersion'
    ) as HTMLSelectElement;
    const versionId = versionSelect.options[versionSelect.selectedIndex].value;

    for (let index = 0; index < linkedIssues.length; index++) {
      addVersionToTicket(jiraBaseUrl, linkedIssues[index].key, versionId);
    }

    var actionElement = document.getElementById('set-fixed-version');
    actionElement.classList.toggle('hidden');
    var successElement = document.getElementById('set-fixed-version-success');
    successElement.classList.toggle('hidden');
  };

  const pullRequest = await getPullRequest();
  if (pullRequest.toRef.displayId === 'master') {
    const jiraBaseUrl = linkedIssues[0].self.split('/rest/')[0];
    const versions = await getProjectVersions(jiraBaseUrl);

    const versionsHtml = versions.values.map(version => {
      return (
        <option value={version.id} key={version.id}>
          {version.name}
        </option>
      );
    });

    select(selector).parentElement.prepend(
      <h3>Release actions</h3>,
      <div id="set-fixed-version">
        <select id="targetVersion">{versionsHtml}</select>
        <button
          onClick={addVersionToTickets.bind('https://di-tst.vaudoise.ch')}
        >
          Add fixed in version label on JIRA tickets
        </button>
      </div>,
      <div id="set-fixed-version-success" className="hidden">
        Fixed version was set !
      </div>
    );
  }

  select(selector).parentElement.prepend(
    <h3>Jira issues</h3>,
    <ul className="linked-jira">{linkedIssuesHtml}</ul>
  );
}

features.add({
  id: 'pr-linked-jira-summary',
  include: [features.isPRDetailsOverview],
  load: features.onAjaxedPages,
  init,
});
