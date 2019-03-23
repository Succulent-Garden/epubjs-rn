import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Animated,
  Modal,
  StatusBar
} from 'react-native';

import { Epub, Streamer } from "epubjs-rn";

import TopBar from './app/TopBar'
import BottomBar from './app/BottomBar'
import Nav from './app/Nav'

class EpubReader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      flow: "scrolled-continuous", // paginated || scrolled-continuous
      location: 6,
      url: "https://s3.amazonaws.com/epubjs/books/moby-dick.epub",
      src: "",
      origin: "",
      title: "",
      toc: [],
      showBars: true,
      showNav: false,
      sliderDisabled: true
    };

    this.streamer = new Streamer();
  }

  componentDidMount() {
    this.streamer.start()
      .then((origin) => {
        this.setState({origin})
        return this.streamer.get(this.state.url);
      })
      .then((src) => {
        return this.setState({src});
      });

    setTimeout(() => this.toggleBars(), 1000);
  }

  componentWillUnmount() {
    this.streamer.kill();
  }

  toggleBars() {
    this.setState({ showBars: !this.state.showBars });
  }


  render() {
    // const icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAu5JREFUWAm9lU+ITWEYxp2ZMZOYZCil1Fgoo2YKNcooG5vZ2ChSKBploRRlN7KQBVEa5E9RkxILxv9sZiMsKAsbsVCUf5G4+TMzzPV7zrzf9Z17v3vmnrn3euu57/e97/O8z3fuOZ0TTSPy+XwDaQUYA99ATjmKohFyXSPSdA5wlrQj4DRKrXAgW/v7RtPs4rC/AvrKShzgAagm7iN2h6nM1FhNlnVVipNgALRWiE54HWA1GOQQW/gnxllnC4SX7fJPZFPGt++QaZXOg/i2ZpqD6JzUxGAmoZHRHY3VEz+nM89Ad8wGDGUW/zvEgHeI45nmIDxg4uFMQo+MPgJnbI7SEa+dvoS8x4RP0pnpXWboEBdsltLBdIV1IfaZ6EWaAM5CMHcSTgOcizZPqT+NH/cgbTTB+3Jk+u5BG2G9rhxPdfqN4ApwsS+NL0GvMX+EiPTarH+P/BtcCvH8GpwmcA242O33E2sYPY5Fdi+nAodaM/gIZK7YUGimLOBJd0sCi51BOs1OxyC3hUjUu8ApEPpmhCRxDX4L0D+nGAfbS8gU29W1aC8hVFlg7gwwbPP/kDcnRlKYY02l/YlmjTbMnQn00VLoViZvI4XX6hA64dYa+SbGMLcVPAKKMbCyQGAzCzwECp1wU6FZwwVz+2Vg0ZcYTXE2eGxNnXB9glDlhnl7bbbSVTC9ZCRFPQ9PgWIUpL50SgaUKTDHN9f7odTcaWnOA8+AQm++XtebSkbvmw+xL2/uDCDNB8+B4idY63pZMrrs5s4A8QLwEii+gzWuV0mG75tfZz/5lRcPRqQv4CugyIGeYk5oD883v8G+OcSrqIZ4EXgDFF9Bd5qQvm9+k/3UzZ0RQxaDt0DxBSx3PT9Tr725M2B4B/gAFJ9Bl+sps/fN9RWs/sp9AzPRl/MTUOgTvTRgfpt6S7G2ZnuGLwO6DYp34HC8mvi5Q6qfubsKTLqBHkg//o+5d4hVuOfsBHfJ9b9yZ+4ypkvAtqma/wXjJA9YlNZEuQAAAABJRU5ErkJggg=='
    const icon = null

    return (
      <View style={styles.container}>
        <StatusBar hidden={!this.state.showBars}
          translucent={true}
          animated={false} />
        <Epub style={styles.reader}
              ref="epub"
              //src={"https://s3.amazonaws.com/epubjs/books/moby-dick.epub"}
              src={this.state.src}
              flow={this.state.flow}
              location={this.state.location}
              onLocationChange={(visibleLocation)=> {
                console.log("locationChanged", visibleLocation)
                this.setState({visibleLocation});
              }}
              onLocationsReady={(locations)=> {
                // console.log("location total", locations.total);
                this.setState({sliderDisabled : false});
              }}
              onReady={(book)=> {
                // console.log("Metadata", book.package.metadata)
                // console.log("Table of Contents", book.toc)
                this.setState({
                  title : book.package.metadata.title,
                  toc: book.navigation.toc
                });
              }}
              onPress={(cfi, position, rendition)=> {
                this.toggleBars();
                console.log("press", cfi);
              }}
              onLongPress={(cfi, rendition)=> {
                console.log("longpress", cfi);
              }}
              onViewAdded={(index) => {
                console.log("added", index)
              }}
              beforeViewRemoved={(index) => {
                console.log("removed", index)
              }}
              onSelected={(cfiRange, rendition, selectedText) => {
                console.log("selected", cfiRange)
                // Add marker
                rendition.highlight(
                  cfiRange, 
                  {
                    'icon': icon,
                    'remark': '一二三四五六七八九十一二三四壹贰叁肆伍陆柒捌玖拾',
                    'buttons': [
                      {
                        'icon': icon,
                        'title': '编辑'
                      },
                      {
                        'icon': icon,
                        'title': '删除'
                      },
                      {
                        'icon': icon,
                        'title': '复制'
                      },
                    ]
                  }, 
                  'epubjs-hl-red'
                )
              }}
              onMarkClicked={(cfiRange) => {
                // console.log("mark clicked", cfiRange)
              }}
              // themes={{
              //   tan: {
              //     body: {
              //       "-webkit-user-select": "none",
              //       "user-select": "none",
              //       "background-color": "tan"
              //     }
              //   }
              // }}
              // theme="tan"
              // regenerateLocations={true}
              // generateLocations={true}
              origin={this.state.origin}
              onError={(message) => {
                console.log("EPUBJS-Webview", message);
              }}
              onPopupMenuPress={ (e) => console.log('onPopupMenuPress: ', e) }
              innerStyle={"setTimeout(() => {(function() { var node = document.createElement('style'); document.body.appendChild(node); window.addStyleString = function(str) { node.innerHTML = str; } }());;addStyleString('.epubjs-hl-red {fill: red; fill-opacity; mix-blend-mode: multiply}')}, 1000); true;"}
            />
            <View
              style={[styles.bar, { top:0 }]}>
              <TopBar
                title={this.state.title}
                shown={this.state.showBars}
                onLeftButtonPressed={() => this._nav.show()}
                onRightButtonPressed={
                  (value) => {
                    if (this.state.flow === "paginated") {
                      this.setState({flow: "scrolled-continuous"});
                    } else {
                      this.setState({flow: "paginated"});
                    }
                  }
                }
               />
            </View>
            <View
              style={[styles.bar, { bottom:0 }]}>
              <BottomBar
                disabled= {this.state.sliderDisabled}
                value={this.state.visibleLocation ? this.state.visibleLocation.start.percentage : 0}
                shown={this.state.showBars}
                onSlidingComplete={
                  (value) => {
                    this.setState({location: value.toFixed(6)})
                  }
                }/>
            </View>
            <View>
              <Nav ref={(nav) => this._nav = nav }
                display={(loc) => {
                  this.setState({ location: loc });
                }}
                toc={this.state.toc}
              />
            </View>
      </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reader: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#3F3F3C'
  },
  bar: {
    position:"absolute",
    left:0,
    right:0,
    height:55
  }
});

export default EpubReader;
