const layout = {
  "lg": [
    { "i": "topics", "x": 0, "y": 0, "w": 4, "h": 8},
    { "i": "locations", "x": 4, "y": 0, "w": 4, "h": 8},
    { "i": "sources", "x": 8, "y": 0, "w": 4, "h": 8},
    { "i": "timeline", "x": 12, "y": 0, "w": 12, "h": 8 },
    { "i": "watchlist", "x": 0, "y": 9, "w": 5, "h": 16},
    { "i": "heatmap", "x": 5, "y": 6, "w": 14, "h": 16 },
    { "i": "newsfeed", "x": 19, "y": 6, "w": 5, "h": 16 }
  ]
};

const layoutCollapsed = {
  "lg": [
    { "i": "watchlist", "x": 0, "y": 0, "w": 4, "h": 22, static: true },
    { "i": "heatmap", "x": 4, "y": 0, "w": 14, "h": 22, static: true },
    { "i": "newsfeed", "x": 18, "y": 0, "w": 6, "h": 22, static: true }
  ]
};

const defaultLayout = { layout, layoutCollapsed };

module.exports = {
  defaultLayout
};
