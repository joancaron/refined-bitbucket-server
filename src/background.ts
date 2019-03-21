import OptionsSync from 'webext-options-sync';

// Define defaults
new OptionsSync().define({
  defaults: {
    disabledFeatures: '',
    customCSS: '',
    personalToken: '',
    logging: false,
    bitbucketServer: '',
  },
  migrations: [OptionsSync.migrations.removeUnused],
});
