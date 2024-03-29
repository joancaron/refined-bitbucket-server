import { getCleanPathname } from './utils';
import select from 'select-dom';

interface PageContext {
  repoSlug: string;
  projectKey: string;
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
  const context = location.pathname.match(
    /\/projects\/([^/]*)\/repos\/([^/]*)\/pull-requests\/([^/]*)/
  );
  return {
    repoSlug: context[2],
    projectKey: context[1],
    pullRequestId: context[3],
  };
};
