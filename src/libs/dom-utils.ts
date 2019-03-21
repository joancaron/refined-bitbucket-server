import domLoaded from 'dom-loaded';
import elementReady from 'element-ready';

/*
 * Automatically stops checking for an element to appear once the DOM is ready.
 */
export const safeElementReady = (selector: string) => {
  const waiting = elementReady(selector);

  // Don't check ad-infinitum
  // eslint-disable-next-line promise/prefer-await-to-then
  domLoaded.then(() => requestAnimationFrame(() => waiting.cancel()));

  // If cancelled, return null like a regular select() would
  return waiting.catch(() => null);
};

export const waitForAjaxElement = (selector: string) => {
  return new Promise(resolve => {
    let el = document.querySelector(selector);
    if (el) {
      resolve(el);
    }

    new MutationObserver((_mutationRecords, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach(element => {
        resolve(element);
        //Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
};
