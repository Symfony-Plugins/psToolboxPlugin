// $Id$

psWFJTADefaultFormatter = {
  formatToken: function(data) {
    return data.label + ' %close%';
  },
  formatFeedItem: function(data) {
    return data.label;
  }
}

function psWidgetFormJQueryTokenAutocompleter(options) {

  // default options
  this.options = {
    formatter : 'psWFJTADefaultFormatter',
    min_chars : 1,
    urls : null,
    delay : 300,
    many : true
  };

  // constants
  this.DIRECTION = {
    PREVIOUS : -1,
    NEXT : -2
  };
  this.KEY = {
    DOWN : 40,
    UP : 38,
    BACKSPACE : 8,
    ESCAPE : 27,
    RETURN : 13
  };

  // elements handling
  this.element = null;
  this.input = null;
  this.select = null;
  this.feed = undefined;
  this.typeWatch = null;
  this.defaultsLoaded = false;
  this.formatter = null;

  // data handling
  this.selectedIds = Array();

  // tokens handling
  this.selectedTokenId = undefined;
  this.numTokens = 0;

  // feed handling
  this.ajaxQuery = undefined;
  this.feedData = Array();
  this.selectedFeedItem = null;
  this.numFeedItems = 0;

  this.init(options);
};

psWidgetFormJQueryTokenAutocompleter.prototype = {

  /**
   * 
   */
  init : function(options) {
    var widget = this;

    if (options.min_chars) {
      widget.min_chars = Math.max(widget.min_chars, options.min_chars);
    }

    // formatter
    if (options.formatter) {
      widget.options.formatter = options.formatter;
    }
    eval('widget.formatter = ' + widget.options.formatter + ';');
    
    widget.options.urls = options.urls;

    widget.select = options.select;
    widget.element = widget.select.parent();

    // create list
    widget.itemsList = jQuery('<ul class="ps-wfjta-tokens" />');
    widget.element.append(widget.itemsList);

    // create input tag
    widget.input = jQuery('<input type="text" />').bind('keydown',
        function(event) {

          var startTimer = false;

          switch (event.keyCode) {
            case widget.KEY.DOWN : // down
          event.preventDefault();
          widget.selectFeedItem(widget.DIRECTION.NEXT);
          break;
        case widget.KEY.UP : // up
          event.preventDefault();
          widget.selectFeedItem(widget.DIRECTION.PREVIOUS);
          break;
        case widget.KEY.BACKSPACE : // backspace
          if (widget.selectedTokenId != undefined) {
            widget.removeToken(widget.selectedTokenId);
            event.preventDefault();
          } else if (widget.input.val() == '' && widget.numTokens > 0) {
            var id = jQuery('li:last', widget.itemsList).prev().data('id');
            widget.selectToken(id);
            event.preventDefault();
          } else if (widget.input.val().length <= 1) {
            // input will be empty just after this event, delay removeFeed() for better responsiveness
            var removeTimer = setInterval( function() {
              clearInterval(removeTimer);
              widget.removeFeed();
            }, 10);
          } else {
            startTimer = true;
          }
          break;
        case widget.KEY.ESCAPE :
          if (widget.hasFeed()) {
            widget.removeFeed();
          } else {
            widget.selectToken();
          }

          break;
        case widget.KEY.RETURN : // return
          event.preventDefault();
          if (widget.selectedFeedItem != null) {
            widget.addToken(widget.feedData[widget.selectedFeedItem]);
          }
          break;

        default :
          if (widget.isCharacter(event.keyCode)) {
            startTimer = true;
          }
          break;
      }

      if (startTimer) {
        // add timer
        if (widget.typeWatch) {
          clearInterval(widget.typeWatch);
        }
        widget.typeWatch = setInterval( function() {
          clearInterval(widget.typeWatch);
          widget.createFeed();
        }, widget.options.delay);
      }
    });
    
    widget.input.bind('blur', function(event){
      widget.selectToken();
    });
    
    var li = widget.input.wrap('<li></li>');
    widget.itemsList.append(widget.input);
    widget.input.wrap('<li class="ps-wfjta-input"></li>');

    widget.element.append('<hr />');

    // events are delegated to the div
    widget.element.bind('click', function(event) {
      var target = jQuery(event.target);
      if (target.is('a') && target.hasClass('ps-wfjta-close')) {
        event.preventDefault();
        var liTag = target.parents('li').eq(0);
        widget.removeToken(liTag.data('id'));
        widget.removeFeed();
      } else if (target.is('div') && target.hasClass('ps-wfjta')) {
        widget.selectToken();
      } else {
        var liTag = target.parents('li').eq(0);
        widget.selectToken(liTag.data('id'));
      }

      widget.input.focus();
    });

    // load defaults values
    var defaultValues = Array();
    var optionByValue = Array();
    jQuery('option', widget.select).each( function(index) {
      defaultValues.push(this.value);
      optionByValue[this.value] = this;
    });
    if (widget.options.urls.load != null && widget.options.urls.load != '') {
      jQuery.get(widget.options.urls.load, {
        'defaults[]' : defaultValues
      }, function(data) {
        jQuery.each(data, function(index, value) {
          widget.addToken(value, jQuery(optionByValue[value.id]));
        });
        widget.defaultsLoaded = true;
      }, 'json');
    } else {
      widget.defaultsLoaded = true;
    }
  },

  /**
   * 
   */
  defaultFormatter : function(row) {
    return row.label + ' %close%';
  },

  /**
   * 
   * @param keyCode
   * @return
   */
  isCharacter : function(keyCode) {
    if ((keyCode >= 48 && keyCode <= 90) // 0-1 a-z
        || (keyCode >= 96 && keyCode <= 111)) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * 
   */
  addToken : function(row, optionTag) {
    var widget = this;

    // don't add an existing entry
    if (widget.selectedIds[row.id] != undefined) {
      return;
    }

    var liTag = jQuery('<li/>');
    liTag.data('id', row.id);

    // format li
    var html = widget.formatter.formatToken(row);

    // add close tag
    html = html.replace('%close%', '<a class="ps-wfjta-close" href="#">x</a>');

    liTag.html(html);
    var closeTag = jQuery('a', liTag);

    // add option to the select tag
    if (widget.defaultsLoaded) {
      var optionTag = jQuery('<option selected="selected" value="' + row.id
          + '">' + row.id + '</option>');
      widget.select.append(optionTag);
    }

    widget.selectedIds[row.id] = liTag;
    widget.numTokens++;

    // link option with the liTag
    if (optionTag) {
      liTag.data('optionTag', optionTag);
    }

    // add 'maximized' class
    if (!widget.options.many) {
      liTag.addClass('maximized');
    }

    // remove empty class
    widget.element.removeClass('ps-wfjta-empty');

    // insert the li tag before input
    liTag.hide();
    widget.input.parent().before(liTag);
    liTag.fadeIn('fast');

    // clear input
    widget.input.val('');
    
    // hide the input if no more tokens allowed
    if (!widget.options.many && widget.numTokens >= 1) {
      widget.input.parent().hide();
    }

    // hide feed
    widget.removeFeed();
  },

  /**
   * 
   */
  removeToken : function(id) {
    var widget = this;

    if (widget.selectedIds[id] == undefined) {
      return;
    }

    if (widget.selectedTokenId == id) {
      widget.selectedTokenId = undefined;
    }

    var liTag = widget.selectedIds[id];

    // remove id from array
    widget.selectedIds[id] = undefined;
    widget.numTokens--;

    // remove option tag
    var optionTag = liTag.data('optionTag');
    optionTag.remove();

    // remove li tag
    liTag.fadeOut('fast', function() {
      liTag.remove();
      if (widget.numTokens == 0) {
        widget.element.addClass('ps-wfjta-empty');
      }
    });

    // show input
    if (!widget.options.many && widget.numTokens == 0) {
      widget.input.parent().show();
    }

    // remove feed
    widget.removeFeed();
  },

  killExistingQuery : function() {
    var widget = this;

    if (widget.ajaxQuery != undefined) {
      widget.ajaxQuery.abort();
      widget.ajaxQuery = undefined;
    }
  },

  /**
   * 
   */
  createFeed : function() {
    var widget = this;

    var query = widget.input.val();
    if (query.length < widget.options.min_chars) {
      return;
    }

    widget.killExistingQuery();

    widget.ajaxQuery = jQuery.get(widget.options.urls.search, {
      q : query
    }, function(data) {

      // remove existing feed
        if (widget.feed) {
          widget.removeFeed();
        }
        widget.numFeedItems = 0;
        widget.feedData = Array();

        var feed = jQuery('<ul id="ps-wfjta-feed" />');

        // delegate events
        feed.bind('click', function(event) {
          if (target.is('li')) {
            widget.addToken(widget.feedData[target.data('itemIndex')]);
          }
          widget.removeFeed();
        });

        feed.bind('mouseover', function(event) {
          target = jQuery(event.target);
          if (target.is('li')) {
            widget.selectFeedItem($(target).data('itemIndex'));
          }
        });

        jQuery.each(
            data,
            function(index, row) {
              // filter selected items
              if (widget.selectedIds[row.id] != undefined) {
                return;
              }
              
              // highlight
              row.highlight = widget.highLightQuery(row.label, query);
              
              var line = jQuery('<li />');
              line.html(widget.formatter.formatFeedItem(row));
              widget.feedData[widget.numFeedItems] = row;
              line.data('itemIndex', widget.numFeedItems);
              feed.append(line);
              widget.numFeedItems++;
            });

        if (widget.numFeedItems>0) {
          var offset = widget.element.offset();
          feed.css('left', offset.left);
          var borderBottom = widget.element.css('borderBottomWidth').replace(new RegExp('^([0-9]*)px$'), '$1');
          feed.css('top', offset.top + widget.element.outerHeight() - borderBottom);
          
          var borderLeft = feed.css('borderLeftWidth').replace(new RegExp('^([0-9]*)px$'), '$1');
          var borderRight = feed.css('borderRightWidth').replace(new RegExp('^([0-9]*)px$'), '$1');
          var width = widget.element.outerWidth() - borderLeft - borderRight;
          feed.width(width);
          
          feed.appendTo(document.body);
          widget.feed = feed;
          
          // select first item
          widget.selectFeedItem(0);
        }
      }, 'json');
  },

  /**
   * 
   */
  selectFeedItem : function(itemIndex) {
    var widget = this;

    // remove 'selected' class on previous selected item
    jQuery('li', widget.feed).eq(widget.selectedFeedItem).removeClass('ps-wfjta-selected');

    if (itemIndex == widget.DIRECTION.PREVIOUS
        || itemIndex == widget.DIRECTION.NEXT) {
      // handle state where no item is selected
      if (widget.selectedFeedItem == null) {
        if (itemIndex == widget.DIRECTION.PREVIOUS) {
          return;
        } else if (itemIndex == widget.DIRECTION.NEXT) {
          widget.selectedFeedItem = 0;
        }
      } else {
        // move to new selected item
        if (itemIndex == widget.DIRECTION.NEXT) {
          widget.selectedFeedItem++;
          widget.selectedFeedItem = Math.min(widget.selectedFeedItem,
              widget.numFeedItems - 1);
        } else if (itemIndex == widget.DIRECTION.PREVIOUS) {
          widget.selectedFeedItem--;
          if (widget.selectedFeedItem < 0) {
            widget.selectedFeedItem = null;
          }
        }
      }
    } else if (itemIndex >= 0 && itemIndex < widget.numFeedItems) {
      widget.selectedFeedItem = itemIndex;
    }

    // add 'selected' class on new selected item
    if (widget.selectedFeedItem != null) {
      jQuery('li', widget.feed).eq(widget.selectedFeedItem).addClass('ps-wfjta-selected');
    }
  },

  /**
   * 
   */
  removeFeed : function() {
    var widget = this;

    widget.killExistingQuery();

    widget.selectedFeedItem = null;
    if (widget.feed != undefined) {
      widget.feed.remove();
    }
    widget.feed = undefined;
  },

  selectToken : function(tokenId) {
    var widget = this;

    // tokens are selectable in 'many' mode only
    if (!widget.options.many) {
      return;
    }

    if (widget.selectedTokenId != undefined) {
      widget.selectedIds[widget.selectedTokenId].removeClass('ps-wfjta-selected');
      widget.selectedTokenId = undefined;
    }

    if (widget.selectedIds[tokenId] != undefined) {
      widget.selectedIds[tokenId].addClass('ps-wfjta-selected');
      widget.selectedTokenId = tokenId;
    }
  },

  isInputEmpty : function() {
    var widget = this;

    if (widget.input.val() == '') {
      return true;
    } else {
      return false;
    }
  },

  hasFeed : function() {
    var widget = this;
    if (widget.feed == undefined) {
      return false;
    } else {
      return true;
    }
  },

  highLightQuery : function(text, query) {
    return text.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + query
        + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<em>$1</em>");
  }

};
