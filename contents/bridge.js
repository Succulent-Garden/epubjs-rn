window.onerror = function (message, file, line, col, error) {
  var msg = JSON.stringify({method:"error", value: {
    message: message,
    file: file,
    line: line,
    col: col,
    error: error
  }});
  window.postMessage(msg, "*");
};

(function () {
   var waitForReactNativePostMessageReady;

  function _ready() {
    var contents;
    var targetOrigin = "*";
    var sendMessage = function(obj) {
      window.postMessage(JSON.stringify(obj), targetOrigin);
    };

    window.currentFontSizeScale = 1.0;

    var q = [];
    var _isReady = false;

    var book;
    var rendition;

    var minSpreadWidth = 815;
    var axis = "horizontal";

    var isChrome = /Chrome/.test(navigator.userAgent);
    var isWebkit = !isChrome && /AppleWebKit/.test(navigator.userAgent);

    // debug
    console.log = function() {
      sendMessage({method:"log", value: Array.from(arguments)});
    }

    console.error = function() {
      sendMessage({method:"error", value: Array.from(arguments)});
    }

    // var isReactNativePostMessageReady = !!window.originalPostMessage;
    var isReactNativePostMessageReady = !!window.originalPostMessage || window.postMessage.toString().indexOf("[native code]") === -1;
    var hasReactNativePostMessage = typeof window.webkit !== "undefined" &&
                                    typeof window.webkit.messageHandlers !== "undefined" &&
                                    typeof window.webkit.messageHandlers.reactNative !== "undefined" &&
                                    typeof window.webkit.messageHandlers.reactNative.postMessage !== "undefined";

    clearTimeout(waitForReactNativePostMessageReady);
    if (!isReactNativePostMessageReady && hasReactNativePostMessage) {
      window.originalPostMessage = window.postMessage;
      window.postMessage = function (data) { window.webkit.messageHandlers.reactNative.postMessage(data); };
    } else if (!isReactNativePostMessageReady && !hasReactNativePostMessage){
      waitForReactNativePostMessageReady = setTimeout(_ready, 1);
      return;
    }

    function onMessage(e) {
      var message = e.data;
      // console.log('[epb-bridge] got message: ', message)
      handleMessage(message);
    }

    function handleMessage(message) {
      // console.log('[bridge] handleMessage: ', message)
      var decoded = (typeof message == "object") ? message : JSON.parse(message);
      var response;
      var result;

      switch (decoded.method) {
        case "open": {
          var url = decoded.args[0];
          var options = decoded.args.length > 1 && decoded.args[1];
          openEpub(url, options);

          if (options && options.webviewStylesheet) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = options.webviewStylesheet;
            head.appendChild(link);
          }

          break;
        }
        case "display": {
          var args = decoded.args && decoded.args.length && decoded.args[0];
          var target;

          if (!args) {
            target = undefined;
          }
          else if (args.target) {
            target = args.target.toString();
          }
          else if (args.spine) {
            target = parseInt(args.spine);
          }

          if (rendition) {
            rendition.display(target);
          } else {
            q.push(message);
          }
          break;
        }
        case "flow": {
          var direction = decoded.args.length && decoded.args[0];
          axis = (direction === "paginated") ? "horizontal" : "vertical";

          if (rendition) {
            rendition.flow(direction);
          } else {
            q.push(message);
          }

          break;
        }
        case "resize": {
          var width = decoded.args.length && decoded.args[0];
          var height = decoded.args.length > 1 && decoded.args[1];

          if (rendition) {
            rendition.resize(width, height);
          } else {
            q.push(message);
          }

          break;
        }
        case "setLocations": {
          var locations = decoded.args[0];
          if (book) {
            book.locations.load(locations);
          } else {
            q.push(message);
          }

          if (rendition) {
            rendition.reportLocation();
          }
          break;
        }
        case "reportLocation": {
          if (rendition) {
            rendition.reportLocation();
          } else {
            q.push(message);
          }
          break;
        }
        case "minSpreadWidth": {
          minSpreadWidth = decoded.args;
          break;
        }
        case "mark": {
          if (rendition) {
            rendition.annotations.mark.apply(rendition.annotations, decoded.args);
          } else {
            q.push(message);
          }
          break;
        }
        case "underline": {
          if (rendition) {
            rendition.annotations.underline.apply(rendition.annotations, decoded.args);
          } else {
            q.push(message);
          }
          break;
        }
        case "highlight": {
          if (rendition) {
            let args = decoded.args

            const cfiRange = args[0]
            const x = rendition.annotations.highlight(
              cfiRange,
              args[1],
              (e) => {
                const cfiRange = args[0]
                const range = new ePub.CFI(cfiRange)
                const viewContainer = rendition.manager.views.find({index: x.sectionIndex})

                if (e.userData != '圆圈') {
                  rendition.annotations.popupMenu(
                    cfiRange,
                    { 'buttons': args[1].buttons },
                    (e) => {
                      if (e.userData) {
                        sendMessage({method: 'popupMenu', args: e.userData})
                        viewContainer.unpopupMenu()
                      }
                    },
                  )
                }
                else {
                  if (args[1].remark && args[1].remark.length > 0) {
                    rendition.annotations.popupMenu(
                      cfiRange,
                      { 'text': args[1].remark },
                      (e) => { viewContainer.unpopupMenu() },
                    )
                  }
                }
              },
              args[2]
            )
            contents.window.getSelection().removeAllRanges()

            // << highlight end <<
          } else {
            q.push(message);
          }
          break;
        }
        case "removeAnnotation": {
          if (rendition) {
            rendition.annotations.remove.apply(rendition.annotations, decoded.args);
          } else {
            q.push(message);
          }
          break;
        }
        case "search": {
          if (rendition) {
            rendition.search(decoded.args).then(results => {
              sendMessage({method: 'search', args: results})
            });
          } else {
            q.push(message)
          }
          break;
        }
        case "themes": {
          var themes = decoded.args[0];
          if (rendition) {
            rendition.themes.register(themes);
          } else {
            q.push(message);
          }
          break;
        }
        case "theme": {
          var theme = decoded.args[0];
          if (rendition) {
            rendition.themes.select(theme);
          } else {
            q.push(message);
          }
          break;
        }
        case "fontSize": {
          var fontSize = decoded.args[0];
          var scale = decoded.args[1];
          window.currentFontSizeScale = scale;
          console.log('[bridge]->fontSize: ', decoded.args)
          if (rendition) {
            rendition.themes.fontSize(fontSize, window.currentFontSizeScale);
          } else {
            q.push(message);
          }
          break;
        }
        case "font": {
          var font = decoded.args[0];
          if (rendition) {
            rendition.themes.font(font);
          } else {
            q.push(message);
          }
          break;
        }

        case "override": {
          if (rendition) {
            rendition.themes.override.apply(rendition.themes, decoded.args);
          } else {
            q.push(message);
          }
          break;
        }
        case "gap": {
          var gap = decoded.args[0];
          if (rendition) {
            rendition.settings.gap = gap;
            if (rendition.manager) {
              rendition.manager.settings.gap = gap;
            }
          } else {
            q.push(message);
          }
          break;
        }
        case "next": {
          if (rendition) {
            rendition.next();
          } else {
            q.push(message);
          }
          break;
        }
        case "prev": {
          if (rendition) {
            rendition.prev();
          } else {
            q.push(message);
          }
          break;
        }
        case "n2n": {
          sendMessage({method: 'n2n', args: decoded.value})
          break;
        }
      }
    }

    function openEpub(url, options) {
      var settings = Object.assign({
        manager: "continuous",
        overflow: "visible",
        method: "blobUrl",
        fullsize: true,
        snap: isChrome,
        preRenderHook: (doc) => {
          ePub.utils.updateFontSize(doc, window.currentFontSizeScale);
            // 新加内容
          doc.body.querySelectorAll('img').forEach((t) => {
            t.addEventListener('click', () => {
              sendMessage({method:"n2n", args: `image:${t.alt}:${t.src}`});
            });
          });
        },
        onScrollHook: () => {
          const render = window.rendition
          const values = Object.values(render.annotations._annotations)
          const popups = values.filter(x => x.type == 'popup')
          if (popups.length == 0) {
            return;
          }
          popups.forEach(element => {
            render.annotations.remove(element.cfiRange, element.type)
          });
        },
      }, options);

      window.book = book = ePub(url, options);

      window.rendition = rendition = book.renderTo(document.body, settings);

      rendition.hooks.content.register(function(contents, rendition) {
        var doc = contents.document;
        var startPosition = { x: -1, y: -1 };
        var currentPosition = { x: -1, y: -1 };
        var isLongPress = false;
        var longPressTimer;
        var touchduration = 300;
        var $body = doc.getElementsByTagName('body')[0];

        function touchStartHandler(e) {
          var f, target;
          startPosition.x = e.targetTouches[0].pageX;
          startPosition.y = e.targetTouches[0].pageY;
          currentPosition.x = e.targetTouches[0].pageX;
          currentPosition.y = e.targetTouches[0].pageY;
          isLongPress = false;

          if (isWebkit) {
            for (var i=0; i < e.targetTouches.length; i++) {
              f = e.changedTouches[i].force;
              if (f >= 0.8 && !preventTap) {
                target = e.changedTouches[i].target;

                if (target.getAttribute("ref") === "epubjs-mk") {
                  return;
                }

                clearTimeout(longPressTimer);

                cfi = contents.cfiFromNode(target).toString();

                sendMessage({method:"longpress", position: currentPosition, cfi: cfi});
                isLongPress = false;
                preventTap = true;
              }
            }
          }


          longPressTimer = setTimeout(function() {
            target = e.targetTouches[0].target;

            if (target.getAttribute("ref") === "epubjs-mk") {
              return;
            }

            cfi = contents.cfiFromNode(target).toString();

            sendMessage({method:"longpress", position: currentPosition, cfi: cfi});
            preventTap = true;
          }, touchduration);
        }

        function touchMoveHandler(e) {
          currentPosition.x = e.targetTouches[0].pageX;
          currentPosition.y = e.targetTouches[0].pageY;
          clearTimeout(longPressTimer);
        }

        function touchEndHandler(e) {
          var cfi;
          clearTimeout(longPressTimer);

          if(preventTap) {
            preventTap = false;
            return;
          }

          if(Math.abs(startPosition.x - currentPosition.x) < 2 &&
             Math.abs(startPosition.y - currentPosition.y) < 2) {

            var target = e.changedTouches[0].target;

            if (target.getAttribute("ref") === "epubjs-mk" ||
                target.getAttribute("ref") === "epubjs-hl" ||
                target.getAttribute("ref") === "epubjs-ul") {
              return;
            }

            cfi = contents.cfiFromNode(target).toString();

            if(isLongPress) {
              sendMessage({method:"longpress", position: currentPosition, cfi: cfi});
              isLongPress = false;
            } else {
              setTimeout(function() {
                if(preventTap) {
                  preventTap = false;
                  isLongPress = false;
                  return;
                }
                sendMessage({method:"press", position: currentPosition, cfi: cfi});
              }, 10);
            }
          }
        }

        function touchForceHandler(e) {
          var f = e.changedTouches[0].force;
          if (f >= 0.8 && !preventTap) {
            var target = e.changedTouches[0].target;

            if (target.getAttribute("ref") === "epubjs-mk") {
              return;
            }

            clearTimeout(longPressTimer);

            cfi = contents.cfiFromNode(target).toString();

            sendMessage({method:"longpress", position: currentPosition, cfi: cfi});
            isLongPress = false;
            preventTap = true;
          }
        }

        doc.addEventListener("touchstart", touchStartHandler, false);

        doc.addEventListener("touchmove", touchMoveHandler, false);

        doc.addEventListener("touchend", touchEndHandler, false);

        doc.addEventListener('touchforcechange', touchForceHandler, false);

      }.bind(this));

      rendition.on("relocated", function(location){
        sendMessage({method:"relocated", location: location});
      });

      rendition.on("selected", function (cfiRange, contents, selectedText) {

        sendMessage({method:"selected", cfiRange: cfiRange, selectedText: selectedText});
      });

      rendition.on("markClicked", function (cfiRange, data) {
        sendMessage({method:"markClicked", cfiRange: cfiRange, data: data});
      });

      rendition.on("rendered", function (section) {
        sendMessage({method:"rendered", sectionIndex: section.index});
      });

      rendition.on("added", function (section) {
        sendMessage({method:"added", sectionIndex: section.index});
      });

      rendition.on("removed", function (section) {
        sendMessage({method:"removed", sectionIndex: section.index});
      });

      rendition.on("resized", function(size){
        sendMessage({method:"resized", size: size});
      });

      // replay messages
      rendition.started.then(function() {
        var msg;
        for (var i = 0; i < q.length; i++) {
          msg = q.shift();
          handleMessage(msg);
        }
      });

      book.ready.then(function(){
        _isReady = true;

        sendMessage({method:"ready"});

      });

      window.addEventListener("unload", function () {
        book && book.destroy();
      });
    }

    window.addEventListener("message", onMessage);
    // React native uses document for postMessages
    document.addEventListener("message", onMessage);

    sendMessage({method:"loaded", value: true});
  }

  if ( document.readyState === 'complete' ) {
    _ready();
  } else {
    window.addEventListener("load", _ready, false);
  }

  // add css style
  var node = document.createElement('style');
  document.body.appendChild(node);
  window.addStyleString = function(str) {
      node.innerHTML = str;
  }

}());
