// STAGE 0 FEASIBILITY SPIKE — config plugin that injects the no-op Siri
// App Intent into the iOS app at prebuild time.
//
// Why a config plugin at all: this project's ios/ folder is gitignored
// (Continuous Native Generation), so EAS regenerates the native project on
// every build. Any Swift we add by hand to ios/ would be wiped. A config
// plugin is the only durable way to get the App Intent into the build.
//
// This plugin does three things:
//   1. Copies EVERY Swift file in plugins/ios/ into the iOS app target's
//      source folder.
//   2. Registers each of those Swift files in the Xcode project's app target
//      so they actually compile.
//   3. Adds the App Group entitlement (so Siri and the app can pass a note
//      through a shared container — harmless on the Simulator, which doesn't
//      enforce entitlements/provisioning).
//
// NOTE for Stage 2 (the eventual EAS device build): the App Group capability
// also has to be enabled for the App ID in Apple's developer portal / the
// provisioning profile. That's an Apple-side step, not something this plugin
// can do. On the local Simulator (Stage 1) it isn't enforced, so it won't
// block the cheap stages.

const {
  withDangerousMod,
  withXcodeProject,
  withEntitlementsPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP = 'group.com.molliedog.ElderlyAssistant';

// Every .swift file in plugins/ios/ gets injected. Drop a new Siri intent file
// in there and it's picked up automatically — no need to edit this plugin.
const swiftFilenames = (projectRoot) =>
  fs
    .readdirSync(path.join(projectRoot, 'plugins', 'ios'))
    .filter((f) => f.endsWith('.swift'));

// 1. Copy every Swift source into ios/<ProjectName>/.
const withSiriIntentSource = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      const destDir = path.join(platformProjectRoot, projectName);
      fs.mkdirSync(destDir, { recursive: true });
      for (const filename of swiftFilenames(projectRoot)) {
        const src = path.join(projectRoot, 'plugins', 'ios', filename);
        fs.copyFileSync(src, path.join(destDir, filename));
      }
      return cfg;
    },
  ]);

// 2. Add each Swift file to the Xcode app target so it compiles.
const withSiriIntentXcode = (config) =>
  withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const { projectName, projectRoot } = cfg.modRequest;

    const groupKey =
      proj.findPBXGroupKey({ name: projectName }) ||
      proj.getFirstProject().firstProject.mainGroup;

    for (const filename of swiftFilenames(projectRoot)) {
      const relPath = `${projectName}/${filename}`;
      if (proj.hasFile(relPath)) {
        continue; // already added (idempotent across re-runs)
      }
      proj.addSourceFile(
        relPath,
        { target: proj.getFirstTarget().uuid },
        groupKey
      );
    }
    return cfg;
  });

// 3. App Group entitlement.
const withAppGroupEntitlement = (config) =>
  withEntitlementsPlist(config, (cfg) => {
    const key = 'com.apple.security.application-groups';
    const existing = cfg.modResults[key] || [];
    if (!existing.includes(APP_GROUP)) {
      cfg.modResults[key] = [...existing, APP_GROUP];
    }
    return cfg;
  });

module.exports = (config) => {
  config = withSiriIntentSource(config);
  config = withSiriIntentXcode(config);
  config = withAppGroupEntitlement(config);
  return config;
};
