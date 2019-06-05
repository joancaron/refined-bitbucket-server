import React from 'dom-chef';
import mem from 'mem';
import features from './features';
import { JsonObject } from 'type-fest';
import { banner } from './notification';

interface AtlassianApiResponse {
  data?: JsonObject;
  errors?: JsonObject[];
}

export class AtlassianAPIError extends Error {
  public constructor(...messages: string[]) {
    super(messages.join('\n'));
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST';
  body?: undefined | JsonObject;
}

const apiDefaults: ApiOptions = {
  method: 'GET',
  body: undefined,
};

const bitbucketRootUrl = `${location.origin}/rest/jira/latest/projects`;
const jiraIntegrationRootUrl = `${
  location.origin
}/rest/jira-integration/latest`;

async function getError(errors: JsonObject[]): Promise<AtlassianAPIError> {
  let messageContainer = <div className="rbs-errors" />;
  errors.map(error => {
    let errorMessage = <p>{error.message} </p>;

    if (
      error.exceptionName ===
      'com.atlassian.integration.jira.JiraAuthenticationRequiredException'
    ) {
      errorMessage.appendChild(
        <a title={error.message} href={error.authenticationUri} target="blank">
          {error.authenticationUri}
        </a>
      );
    }

    messageContainer.appendChild(errorMessage);
  });

  banner(messageContainer);

  return new AtlassianAPIError(
    'Unable to fetch.',
    JSON.stringify(errors, null, '\t')
  );
}

export const callApi = mem(
  async (
    query: string,
    options: ApiOptions = apiDefaults
  ): Promise<AnyObject> => {
    const { method, body } = { ...apiDefaults, ...options };
    const response = await fetch(query, {
      method,
      body: body && JSON.stringify(body),
    });

    const apiResponse: AtlassianApiResponse = await response.json();

    const { errors = [] } = apiResponse;

    if (!response.ok || errors.length > 0) {
      throw getError(errors);
    }

    if (response.ok) {
      return apiResponse;
    }
  }
);

const prLinkedIssues = async () => {
  let linkedIssueDetails;

  const pageContext = features.pageContext();

  const linkedIssues = await callApi(
    `${bitbucketRootUrl}/${pageContext.projectKey}/repos/${
      pageContext.repoSlug
    }/pull-requests/${pageContext.pullRequestId}/issues`
  );

  const urlParams = new URLSearchParams();

  linkedIssues.forEach(linkedIssue => {
    urlParams.append('issueKey', linkedIssue.key);
  });
  urlParams.append('fields', '*all,-comment');
  urlParams.append('minimum', '10');
  
  linkedIssueDetails = await callApi(
    `${jiraIntegrationRootUrl}/issues?${urlParams.toString()}`
  );

  return linkedIssueDetails;
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
