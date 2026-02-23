import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'architecture',
      label: 'Architecture',
    },
    {
      type: 'doc',
      id: 'plugin-development',
      label: 'Plugin Development',
    },
    {
      type: 'category',
      label: 'Community',
      items: [
        'contributing',
        'rfc-process',
      ],
    },
  ],
};

export default sidebars;
