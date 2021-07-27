import React from 'dom-chef';
import features from '../libs/features';
import { prLinkedIssues, executeIssueTransitions } from '../libs/api';
import { waitForAjaxElement } from '../libs/dom-utils';
import select from 'select-dom';
import delegate, { DelegateEvent } from 'delegate-it';

function getTransitionsMarkup(transitions: Transition[]) {
  const transitionList = transitions.map(transition => {
    return (
      <li key={transition.id}>
        <a
          className="jira-transition"
          data-transition-id={transition.id}
          href="#"
        >
          {transition.name}
        </a>
      </li>
    );
  });
  return (
    <ul className="jira-transitions aui-list-truncate">{transitionList}</ul>
  );
}

async function issueTransition(
  event: DelegateEvent<MouseEvent, HTMLButtonElement>
): Promise<void> {
  event.preventDefault();

  const rootNode = event.delegateTarget.closest(
    '.jira-issue-detailed'
  ) as HTMLElement;

  const transitionResult = await executeIssueTransitions(
    rootNode.dataset.applicationId,
    rootNode.dataset.issueKey,
    event.delegateTarget.dataset.transitionId
  );

  // Display the current transition
  rootNode.getElementsByClassName('issue-status')[0].innerHTML =
    transitionResult.fields.status.name;

  // Replace transition dropdown items
  const transitionsMarkup = getTransitionsMarkup(transitionResult.transitions);
  const transitionsWrapper = rootNode.getElementsByClassName(
    'jira-transitions'
  )[0];
  transitionsWrapper.innerHTML = '';
  transitionsWrapper.appendChild(transitionsMarkup);
}

async function init() {
  const selector = '.pull-request-details';

  await waitForAjaxElement(selector);

  if (select.exists('.rvb .linked-jira')) {
    return false;
  }

  const linkedIssues = await prLinkedIssues();

  const linkedIssuesHtml = linkedIssues.map(linkedIssue => {
    let transitionsWrapper;
    if (linkedIssue.canTransition) {
      let transitionHtmlId = `jira-more-transitions${linkedIssue.key}`;

      // Jira transitions buttons
      transitionsWrapper = (
        <div>
          <button
            className="aui-button aui-dropdown2-trigger"
            aria-controls={transitionHtmlId}
          >
            JIRA transitions
          </button>
          <div
            id={transitionHtmlId}
            className="aui-dropdown2 aui-style-default aui-layer"
          >
            {getTransitionsMarkup(linkedIssue.transitions)}
          </div>
        </div>
      );
    }
    return (
      <tr
        className="jira-issue-detailed"
        key={linkedIssue.key}
        data-issue-key={linkedIssue.key}
        data-application-id={linkedIssue.applicationLinkId}
      >
        <td>
          <img
            src={linkedIssue.fields.issuetype.iconUrl}
            alt={linkedIssue.fields.issuetype.name}
            className="aui-icon"
          />
          {linkedIssue.fields.issuetype.name}
        </td>
        <td>
          <a
            href={`/plugins/servlet/jira-integration/issues/${linkedIssue.key}`}
            className="markup-issues-trigger"
            data-issue-keys={linkedIssue.key}
            data-initial-issue-key={linkedIssue.key}
            data-single-issue="true"
            original-title={linkedIssue.key}
          >
            {linkedIssue.key}
          </a>
        </td>
        <td>{linkedIssue.fields.summary}</td>
        <td>
          <span className="aui-lozenge aui-lozenge-subtle aui-lozenge-inprogress issue-status">
            {linkedIssue.fields.status.name}
          </span>
        </td>
        <td>{transitionsWrapper}</td>
      </tr>
    );
  });

  select(selector).parentElement.prepend(
    <table className="linked-jira aui">
      <tbody>{linkedIssuesHtml}</tbody>
    </table>
  );

  // Handle clicks on Jira transitions buttons
  delegate('.linked-jira .jira-transition', 'click', issueTransition);
}

features.add({
  id: 'pr-linked-jira-summary',
  include: [features.isPRDetailsOverview],
  load: features.onAjaxedPages,
  init,
});
