import { getCleanPathname } from './utils';
import select from 'select-dom';

interface PageContext {
  repoSlug: string;
  projectKey: string;
  repoName: string;
  projectName: string;
  pullRequestId?: string;
}

export const is404 = (): boolean => select.exists('.error-image _404');

export const is500 = (): boolean => select.exists('.error-image _500');

export const isProject = (): boolean =>
  /^.*projects\/.*/.test(getCleanPathname() as string);

export const isPRDetails = (): boolean =>
  /^.*pull-requests\/\d*\/.*/.test(getCleanPathname() as string);

export const isPRDetailsOverview = (): boolean =>
  /^.*pull-requests\/\d*\/overview/.test(getCleanPathname() as string);

export const isPRDetailsDiff = (): boolean =>
  /^.*pull-requests\/\d*\/(diff|unreviewed)/.test(getCleanPathname() as string);

export const isSource = (): boolean =>
  /^.*browse/.test(getCleanPathname() as string);

export const pageContext = (): PageContext => {
  const context = select('#content');
  return {
    repoSlug: context.dataset.reposlug,
    projectKey: context.dataset.projectkey,
    repoName: context.dataset.reponame,
    projectName: context.dataset.projectname,
    pullRequestId: context.dataset.pullrequestid,
  };
};
