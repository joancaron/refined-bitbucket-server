import features from './features';

const bitbucketRootUrl = `${location.origin}/rest/jira/latest/projects`;
const jiraIntegrationRootUrl = `${
  location.origin
}/rest/jira-integration/latest`;

export const prLinkedIssues = async () => {
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
