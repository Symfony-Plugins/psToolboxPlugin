psWFJTAFormatter = {
  formatToken: function(data) {
    return '<span><span><span><span>' + data.label + ' %close%</span></span></span></span>';
  },
  formatFeedItem: function(data) {
    return data.highlight;
  }
}