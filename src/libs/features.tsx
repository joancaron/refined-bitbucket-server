import React from 'dom-chef';
import select from 'select-dom';
import onDomReady from 'dom-loaded';
import OptionsSync from 'webext-options-sync';
import * as pageDetect from './page-detect';
import { safeElementReady } from './dom-utils';

type BooleanFunction = () => boolean;
type VoidFunction = () => void;
type callerFunction = (callback: VoidFunction) => void;
type featureFunction = () => boolean | void;
type featurePromisedFunction = () => Promise<boolean | void>;

type FeatureShortcuts = Record<string, string>;

interface Shortcut {
  hotkey: string;
  description: string;
}

interface GlobalOptions {
  disabledFeatures: string;
  customCSS: string;
  logging: boolean;
  bitbucketServer: string;
  log?: (...args: unknown[]) => void;
}

interface FeatureDetails {
  id: string;
  include?: BooleanFunction[];
  exclude?: BooleanFunction[];
  init: featureFunction | featurePromisedFunction;
  deinit?: () => void;
  load?: callerFunction | Promise<void>;
  shortcuts?: FeatureShortcuts;
}

interface PrivateFeatureDetails extends FeatureDetails {
  options: GlobalOptions;
}

async function onAjaxedPages(callback: () => void) {
  await onDomReady;
  const elements = select.all(
    '.pull-request-content, .aui-page-panel-content, .filebrowser-content'
  );

  if (!elements) {
    return false;
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        callback();
      }
    });
  });

  elements.forEach(element => observer.observe(element, { childList: true }));

  callback();
}

// Rule assumes we don't want to leave it pending:
// eslint-disable-next-line no-async-promise-executor
const globalReady: Promise<GlobalOptions> = new Promise(async resolve => {
  await safeElementReady('body');

  // Options defaults
  const options: GlobalOptions = {
    disabledFeatures: '',
    customCSS: '',
    logging: false,
    bitbucketServer: '',
    ...(await new OptionsSync().getAll()),
  };

  if (options.customCSS.trim().length > 0) {
    document.head.append(<style>{options.customCSS}</style>);
  }

  // Create logging function
  options.log = options.logging ? console.log : () => {};

  if (options.bitbucketServer === location.origin) {
    document.documentElement.classList.add('rvb');
  }

  resolve(options);
});

const run = async ({
  id,
  include,
  exclude,
  init,
  deinit,
  options: { log },
}: PrivateFeatureDetails) => {
  // If every `include` is false and no exclude is true, don’t run the feature
  if (include.every(c => !c()) || exclude.some(c => c())) {
    return deinit();
  }

  try {
    // Features can return `false` if they declare themselves as not enabled
    if ((await init()) !== false) {
      log('✅', id);
    }
  } catch (error) {
    console.log('❌', id);
    console.error(error);
  }
};

const shortcutMap: Map<string, Shortcut> = new Map<string, Shortcut>();
const getShortcuts: () => Shortcut[] = () => [...shortcutMap.values()];

/*
 * Register a new feature
 */
const add = async (definition: FeatureDetails) => {
  /* Feature filtering and running */
  const options = await globalReady;
  //Only run when bitbucket server option is filled
  if (location.origin === options.bitbucketServer) {
    /* Input defaults and validation */
    const {
      id,
      include = [() => true], // Default: every page
      exclude = [], // Default: nothing
      load = fn => fn(), // Run it right away
      init,
      deinit = () => {}, // Noop
      shortcuts = {},
      ...invalidProps
    } = definition;

    if (Object.keys(invalidProps).length > 0) {
      throw new Error(
        `${id} was added with invalid props: ${Object.keys(invalidProps).join(
          ', '
        )}`
      );
    }

    if ([...include, ...exclude].some(d => typeof d !== 'function')) {
      throw new TypeError(
        `${id}: include/exclude must be boolean-returning functions`
      );
    }

    if (options.disabledFeatures.includes(id)) {
      options.log('↩️', 'Skipping', id);
      return;
    }

    if (pageDetect.is404() && !include.includes(pageDetect.is404)) {
      return;
    }

    // Register feature shortcuts
    for (const hotkey of Object.keys(shortcuts)) {
      const description = shortcuts[hotkey];
      shortcutMap.set(hotkey, { hotkey, description });
    }

    // Initialize the feature using the specified loading mechanism
    const details: PrivateFeatureDetails = {
      id,
      include,
      exclude,
      init,
      deinit,
      options,
    };

    if (load instanceof Promise) {
      await load;
      run(details);
    } else {
      load(() => run(details));
    }
  }
};

export default {
  // Module methods
  add,
  getShortcuts,

  // Loading mechanisms
  onDomReady,
  onAjaxedPages,

  // Loading filters
  ...pageDetect,
};
