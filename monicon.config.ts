import { reactNative, clean } from '@monicon/core/plugins';
import { MoniconConfig } from '@monicon/core';

export default {
  // Auto-generated icon list
  // - Icons from types/index.ts (facility constants)
  // - Icons from 'npm run add-icon' (preserved during regeneration)
  // Run 'npm run icons' to regenerate after updating types/index.ts
  // Format: 'collection:icon-name' (e.g., 'lucide:home', 'material-symbols:wifi')
  icons: [
    'cil:couch',
    'ic:baseline-bookmark',
    'ic:baseline-my-location',
    'ic:baseline-whatsapp',
    'ic:round-tv',
    'material-symbols:ac-unit',
    'material-symbols:bed',
    'material-symbols:bookmark',
    'material-symbols:chair',
    'material-symbols:chat',
    'material-symbols:close',
    'material-symbols:desk',
    'material-symbols:directions-car',
    'material-symbols:door-open',
    'material-symbols:flash-on',
    'material-symbols:fork-spoon',
    'material-symbols:home',
    'material-symbols:kitchen',
    'material-symbols:laundry',
    'material-symbols:local-laundry-service',
    'material-symbols:location-on',
    'material-symbols:mode-fan',
    'material-symbols:mosque',
    'material-symbols:person',
    'material-symbols:security',
    'material-symbols:sensor-door-outline',
    'material-symbols:settings',
    'material-symbols:shower',
    'material-symbols:tv',
    'material-symbols:two-wheeler',
    'material-symbols:water-drop',
    'material-symbols:water-heater',
    'material-symbols:wifi',
    'material-symbols:window',
    'mdi:toilet',
    'streamline:shelf',
  ],

  plugins: [
    // Clean output folder before generation
    clean({ patterns: ['components/icons'] }),

    // Generate React Native components
    reactNative({ outputPath: 'components/icons' }),
  ],
} satisfies MoniconConfig;
