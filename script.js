require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Swipe",
    "esri/widgets/Legend"
  ], function (WebMap, MapView, Swipe, Legend) {
    let view, swipes;
  
    const scroller = document.querySelector(".scroller");
    const content = scroller.querySelector(".content");
  
    // initialize the map
    const map = new WebMap({
      portalItem: {
        id: "45725ba7d9fb47a0925398919b13d1fa"
      }
    });
  
    map
      .load()
      .then(function () {
        // create the view
        view = new MapView({
          container: "viewDiv",
          map: map,
          zoom: 5,
          center: [-102, 23]
        });
  
        // get the layers from the webmap
        const layers = map.layers;
  
        // create a swipe widget for each layer
        swipes = layers.map(function (layer) {
          return new Swipe({
            view: view,
            disabled: true,
            position: 100,
            direction: "vertical",
            trailingLayers: [layer],
            visibleElements: {
              handle: false,
              divider: true
            }
          });
        });
  
        // create a legend for each layer and add it to the map
        layers.forEach(function (layer) {
          const slide = document.createElement("div");
          slide.className = "slide";
          const legendDiv = document.createElement("div");
          legendDiv.className = "legend";
          const legend = new Legend({
            container: legendDiv,
            view: view,
            style: "card",
            layerInfos: [
              {
                layer: layer
              }
            ]
          });
          slide.appendChild(legendDiv);
          content.appendChild(slide);
        });
  
        return view.when();
      })
      .then(function () {
        let height = 0;
  
        function updateSize() {
          height = view.height * swipes.length;
          setScroll(scroller.scrollTop);
          content.style.height = height + "px";
        }
  
        function clamp(value, min, max) {
          return Math.min(max, Math.max(min, value));
        }
  
        let scroll = 0;
        let ticking = false;
        function setScroll(value) {
          scroll = value;
  
          if (!ticking) {
            requestAnimationFrame(function () {
              ticking = false;
  
              let pageRatio = scroll / view.height;
  
              swipes.forEach(function (swipe, index, swipes) {
                // add each swipe to the view UI
                view.ui.add(swipe);
  
                let position = (index - pageRatio) * 100;
  
                if (position < 0 && swipe.trailingLayers.length) {
                  swipe.leadingLayers.addMany(swipe.trailingLayers);
                  swipe.trailingLayers.removeAll();
                } else if (position >= 0 && swipe.leadingLayers.length) {
                  swipe.trailingLayers.addMany(swipe.leadingLayers);
                  swipe.leadingLayers.removeAll();
                }
  
                if (position < 0) {
                  position += 100;
                }
  
                swipe.position = clamp(position, 0, 100);
              });
            });
  
            ticking = true;
          }
        }
  
        view.watch("height", updateSize);
        updateSize();
  
        // show layer legends after map has loaded
        const legendDivs = document.getElementsByClassName("legend");
        for (let i = 0; i < legendDivs.length; i++) {
          legendDivs[i].style.visibility = "visible";
        }
  
        // stop default scroll
        scroller.addEventListener("wheel", function (event) {
          event.stopImmediatePropagation();
        });
  
        scroller.addEventListener("scroll", function (event) {
          setScroll(scroller.scrollTop);
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  });
  