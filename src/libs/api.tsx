import React from 'dom-chef';
import features from './features';

const bitbucketRootUrl = `${location.origin}/rest/jira/latest/projects`;
const jiraIntegrationRootUrl = `${
  location.origin
}/rest/jira-integration/latest`;

const prLinkedIssues = async () => {
  const pageContext = features.pageContext();

  const linkedIssuesRequest = await fetch(
    `${bitbucketRootUrl}/${pageContext.projectKey}/repos/${
      pageContext.repoSlug
    }/pull-requests/${pageContext.pullRequestId}/issues`
  );
  const linkedIssues = await linkedIssuesRequest.json();

  const urlParams = new URLSearchParams();

  linkedIssues.forEach(linkedIssue => {
    urlParams.append('issueKey', linkedIssue.key);
  });
  urlParams.append('fields', '*all,-comment');
  urlParams.append('minimum', '10');

  const linkedIssueDetailsRequest = await fetch(
    `${jiraIntegrationRootUrl}/issues?${urlParams.toString()}`
  );
  return linkedIssueDetailsRequest.json();
};

const getProjectVersions = async jiraBaseUrl => {
  const pageContext = features.pageContext();

  const versionsRequest = await fetch(
    `${jiraBaseUrl}/rest/api/2/project/${
      pageContext.projectKey
    }/version?orderBy=-sequence`
  );

  return versionsRequest.json();
};

const getPullRequest = async () => {
  const pageContext = features.pageContext();

  const prRequest = await fetch(
    `${location.origin}/rest/api/1.0/projects/${pageContext.projectKey}/repos/${
      pageContext.repoSlug
    }/pull-requests/${pageContext.pullRequestId}`
  );

  return prRequest.json();
};

const addVersionToTicket = async (jiraBaseUrl, linkedIssueKey, versionId) => {
  const payload = {
    update: {
      fixVersions: [
        {
          add: { id: versionId },
        },
      ],
    },
  };

  const request = await fetch(
    `${jiraBaseUrl}/rest/api/2/issue/${linkedIssueKey}`,
    {
      method: 'PUT',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
  console.log(<p>toto</p>);

  return request.json();
};

export {
  prLinkedIssues,
  getProjectVersions,
  getPullRequest,
  addVersionToTicket,
};
