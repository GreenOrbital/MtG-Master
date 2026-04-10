const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidPackagingOptions(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes('META-INF/versions/9/OSGI-INF/MANIFEST.MF')) {
      return config;
    }
    config.modResults.contents = contents.replace(
      /android \{/,
      `android {\n    packagingOptions {\n        resources {\n            excludes += ['META-INF/versions/9/OSGI-INF/MANIFEST.MF']\n        }\n    }`
    );
    return config;
  });
};
