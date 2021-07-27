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

const bitbucketRootUrl = `${location.origin}/rest/api/latest`;
const jiraIntegrationRootUrl = `${location.origin}/rest/jira-integration/latest`;

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

export async function api<T>(
  query: string,
  options: ApiOptions = apiDefaults,
  wrapped: boolean
): Promise<T> {
  const { method, body } = { ...apiDefaults, ...options };
  const response = await fetch(query, {
    method,
    body: body && JSON.stringify(body),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const { errors = [] } = await (response.json() as Promise<
      AtlassianApiResponse
    >);
    if (errors.length > 0) {
      throw getError(errors);
    }
    throw new Error(response.statusText);
  }

  if (wrapped) {
    const apiResponse = await (response.json() as Promise<{ values: T }>);
    return apiResponse.values;
  }

  return await (response.json() as Promise<T>);
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
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
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

function chunk(arr: string[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

async function retrieveIssues(linkedIssues: string[]) {
  const urlParams = new URLSearchParams();
  linkedIssues.forEach(linkedIssue => {
    urlParams.append('issueKey', linkedIssue);
  });

  urlParams.append('fields', 'summary,issuetype,parent,status');
  urlParams.append('minimum', '10');

  return await api<Issue[]>(
    `${jiraIntegrationRootUrl}/issues?${urlParams.toString()}`,
    apiDefaults,
    false
  );
}

export const prLinkedIssues = async () => {
  const pageContext = features.pageContext();

  const linkedIssues = await api<Issue[]>(
    `${bitbucketRootUrl}/projects/${pageContext.projectKey}/repos/${pageContext.repoSlug}/pull-requests/${pageContext.pullRequestId}/commits?limit=1000`,
    apiDefaults,
    true
  );

  type AssociativeArray<T = unknown> = { [key: string]: T | undefined } | T[];
  let mainIssues: AssociativeArray<Issue> = {};
  const issues = await chunk(
    linkedIssues
      .map(function(p) {
        if (p.properties) {
          return p.properties['jira-key'];
        }
        return [];
      })
      .reduce((a, b) => a.concat(b), []),
    20
  )
    .map(async linkedIssues => await retrieveIssues(linkedIssues))
    .reduce(
      async (a, b) => (await a).concat(await b),
      Promise.resolve(new Array<Issue>())
    );

  issues.forEach(issue => {
    if (issue.fields.parent) {
      mainIssues[issue.fields.parent.key] = issue.fields.parent;
    } else {
      mainIssues[issue.key] = issue;
    }
  });

  return Object.values(mainIssues);
};

export const executeIssueTransitions = async (
  applicationId,
  issueKey,
  transitionId
) => {
  return await callApi(
    `${jiraIntegrationRootUrl}/issues/${issueKey}/transitions?applicationId=${applicationId}&fields=*all,-comment`,
    {
      method: 'POST',
      body: { transition: { id: transitionId } },
    }
  );
};
