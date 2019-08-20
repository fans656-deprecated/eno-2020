export const DOCUMENT_TITLE = 'Activities';

export const NodeStatusStyle = {
  todo: {
    color: {background: '#fff'},
    font: {color: '#222'},
    borderWidth: 0,
  },
  doing: {
    color: {background: '#fff'},
    font: {color: '#222'},
    borderWidth: 1,
    shapeProperties: {borderDashes: [5, 3]},
  },
  done: {
    color: {background: '#fff'},
    font: {color: '#222'},
    borderWidth: 1,
  },
};

export const NETWORK_OPTIONS = {
  clickToUse: true,
  physics: {
    enabled: false,
  },
  interaction: {
    hover: true,
    multiselect: true,
    dragView: true,
  },
  nodes: {shape: 'box'},
  edges: {
    arrows: 'to',
    smooth: false,
    color: {color: '#ddd'},
  },
};
