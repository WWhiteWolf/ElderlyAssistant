// Runs the phone text size reading when the iPhone project is generated.
// The reading itself lives in plugins/apply-phone-text-size.js.

const { withDangerousMod } = require('@expo/config-plugins');
const { applyPhoneTextSize } = require('./apply-phone-text-size');

module.exports = function withPhoneTextSize(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      applyPhoneTextSize(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
};
