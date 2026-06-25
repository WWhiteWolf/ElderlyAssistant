// STAGE 0 FEASIBILITY SPIKE — config plugin that injects the no-op Siri
// App Intent into the iOS app at prebuild time.
//
// Why a config plugin at all: this project's ios/ folder is gitignored
// (Continuous Native Generation), so EAS regenerates the native project on
// every build. Any Swift we add by hand to ios/ would be wiped. A config
// plugin is the only durable way to get the App Intent into the build.
//
// This plugin does three things:
//   1. Copies plugins/ios/OpenRememberWhenIntent.swift into the iOS app
//      target's source folder.
//   2. Registers that Swift file in the Xcode project's app target so it
//      actually compiles.
//   3. Adds the App Group entitlement (so a LATER stage can pass a note
//      between Siri and the app — harmless on the Simulator, which doesn't
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

const SWIFT_FILENAME = 'OpenRememberWhenIntent.swift';
const APP_GROUP = 'group.com.molliedog.ElderlyAssistant';

// 1. Copy the Swift source into ios/<ProjectName>/.
const withSiriIntentSource = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      const src = path.join(projectRoot, 'plugins', 'ios', SWIFT_FILENAME);
      const destDir = path.join(platformProjectRoot, projectName);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, SWIFT_FILENAME));
      return cfg;
    },
  ]);

// 2. Add the Swift file to the Xcode app target so it compiles.
const withSiriIntentXcode = (config) =>
  withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const relPath = `${projectName}/${SWIFT_FILENAME}`;

    if (proj.hasFile(relPath)) {
      return cfg; // already added (idempotent across re-runs)
    }

    const groupKey =
      proj.findPBXGroupKey({ name: projectName }) ||
      proj.getFirstProject().firstProject.mainGroup;

    proj.addSourceFile(
      relPath,
      { target: proj.getFirstTarget().uuid },
      groupKey
    );
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
