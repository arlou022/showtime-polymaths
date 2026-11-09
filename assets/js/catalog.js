/* Everything on the site, in one list.
   To add a topic or chapter: add an entry here (status 'live' or 'soon').
   hrefs are relative to the site root. */
window.CATALOG = {
  subjects: [
    {
      id: 'physics',
      title: 'Physics',
      blurb: 'How the universe works, from a single electron up to circuits, motion and light.',
      href: 'physics/index.html',
      status: 'live',
      topics: [
        {
          id: 'electromagnetism',
          title: 'Electromagnetism',
          blurb: 'Charge, voltage, current and circuits, then magnetism and light.',
          status: 'live',
          chapters: [
            { num: 1, title: 'From Charge to Ohm’s Law', href: 'physics/electromagnetism/ch01-charge-to-ohms-law.html', status: 'live', minutes: 30, figures: 8 },
            { num: 2, title: 'Circuits: Series, Parallel and Kirchhoff’s Rules', status: 'soon' },
            { num: 3, title: 'Magnetism from Moving Charge', status: 'soon' }
          ]
        },
        { id: 'mechanics', title: 'Mechanics', blurb: 'Motion, forces, energy and momentum.', status: 'soon', chapters: [] },
        { id: 'waves', title: 'Waves and Optics', blurb: 'Oscillations, sound, light and interference.', status: 'soon', chapters: [] },
        { id: 'thermo', title: 'Thermodynamics', blurb: 'Heat, temperature, entropy and engines.', status: 'soon', chapters: [] }
      ]
    },
    {
      id: 'energy',
      title: 'Energy',
      blurb: 'How electricity gets from power stations to plugs, and the grid that AI now depends on.',
      href: 'energy/index.html',
      status: 'live',
      topics: [
        {
          id: 'grid',
          title: 'The Grid',
          blurb: 'Generators, transformers, pylons and plugs: how the electricity network actually works.',
          status: 'live',
          chapters: [
            { num: 1, title: 'Why Does the Grid Run at 400,000 Volts?', href: 'energy/grid/ch01-why-400000-volts.html', status: 'live', minutes: 25, figures: 5 },
            { num: 2, title: 'What Happens After the Pylons?', href: 'energy/grid/ch02-after-the-pylons.html', status: 'live', minutes: 25, figures: 5 },
            { num: 3, title: 'System Operation: Keeping 50 Hz Steady', status: 'soon' }
          ]
        }
      ]
    },
    {
      id: 'robotics',
      title: 'Robotics',
      blurb: 'Sensors, motors and control: making machines that sense and move.',
      status: 'soon',
      topics: []
    },
    {
      id: 'ml',
      title: 'Machine Learning',
      blurb: 'From fitting a straight line to training neural networks.',
      status: 'soon',
      topics: []
    }
  ],

  // News explainers, newest first. href is relative to the site root.
  news: [
    {
      date: '2026-11-02',
      title: 'China’s Recent AI Market Crash: What Does It Actually Mean?',
      summary: 'China’s AI stocks lost about 40% in four months, yet the companies are mostly fine. What actually fell, and how a stock crash reaches people who’ve never bought a share.',
      href: 'news/2026-11-02-china-ai-market-crash.html',
      minutes: 6,
      tag: 'Markets · AI'
    }
  ]
};
