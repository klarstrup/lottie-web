let _counterId = 1;
let workerFn;
let workerInstance;
const workerProxy = {
  onmessage(arg?: any) {
    void arg;
  },
  postMessage(data) {
    workerFn({ data });
  },
};
const _workerSelf: {
  postMessage: (a: any) => void;
  dataManager:
    | {
        completeData: (animationData: any) => void;
        checkColors: (animationData: any) => void;
        checkChars: (animationData: any) => void;
        checkPathProperties: (animationData: any) => void;
        checkShapes: (animationData: any) => void;
        completeLayers: (layers: any, comps: any) => void;
      }
    | undefined;
} = {
  postMessage(data) {
    workerProxy.onmessage({ data });
  },
  dataManager: undefined,
};
function createWorker(fn) {
  workerFn = fn;
  return workerProxy;
}

function setupWorker() {
  if (workerInstance) return;
  workerInstance = createWorker(function workerStart(e) {
    function dataFunctionManager() {
      function completeLayers(layers, comps) {
        for (const layerData of layers) {
          if ("ks" in layerData && !layerData.completed) {
            layerData.completed = true;
            if (layerData.hasMask) {
              const maskProps = layerData.masksProperties;

              for (const maskProp of maskProps) {
                if (maskProp.pt.k.i) {
                  convertPathsToAbsoluteValues(maskProp.pt.k);
                } else {
                  for (const maskPropK of maskProp.pt.k) {
                    if (maskPropK.s) convertPathsToAbsoluteValues(maskPropK.s[0]);

                    if (maskPropK.e) convertPathsToAbsoluteValues(maskPropK.e[0]);
                  }
                }
              }
            }
            if (layerData.ty === 0) {
              layerData.layers = findCompLayers(layerData.refId, comps);
              completeLayers(layerData.layers, comps);
            } else if (layerData.ty === 4) {
              completeShapes(layerData.shapes);
            } else if (layerData.ty === 5) {
              completeText(layerData);
            }
          }
        }
      }

      function completeChars(chars, assets) {
        if (!chars) return;
        for (const char of chars) {
          if (char.t !== 1) continue;
          char.data.layers = findCompLayers(char.data.refId, assets);
          completeLayers(char.data.layers, assets);
        }
      }

      function findComp(id, comps) {
        for (const comp of comps) if (comp.id === id) return comp;

        return null;
      }

      function findCompLayers(id, comps) {
        const comp = findComp(id, comps);
        if (!comp) return null;
        if (!comp.layers.__used) {
          comp.layers.__used = true;
          return comp.layers;
        }
        return JSON.parse(JSON.stringify(comp.layers));
      }

      function completeShapes(arr) {
        for (const item of arr) {
          if (item.ty === "sh") {
            if (item.ks.k.i) {
              convertPathsToAbsoluteValues(item.ks.k);
            } else {
              for (const itemItem of item.ks.k) {
                if (itemItem.s) convertPathsToAbsoluteValues(itemItem.s[0]);

                if (itemItem.e) convertPathsToAbsoluteValues(itemItem.e[0]);
              }
            }
          } else if (item.ty === "gr") {
            completeShapes(item.it);
          }
        }
      }

      function convertPathsToAbsoluteValues(path) {
        for (let i = 0; i < path.i.length; i += 1) {
          path.i[i][0] += path.v[i][0];
          path.i[i][1] += path.v[i][1];
          path.o[i][0] += path.v[i][0];
          path.o[i][1] += path.v[i][1];
        }
      }

      function checkVersion(minimum, animVersionString) {
        const animVersion = animVersionString ? animVersionString.split(".") : [100, 100, 100];
        if (minimum[0] > animVersion[0]) return true;

        if (animVersion[0] > minimum[0]) return false;

        if (minimum[1] > animVersion[1]) return true;

        if (animVersion[1] > minimum[1]) return false;

        if (minimum[2] > animVersion[2]) return true;

        if (animVersion[2] > minimum[2]) return false;

        return null;
      }

      function updateTextLayer(textLayer) {
        textLayer.t.d = { k: [{ s: textLayer.t.d, t: 0 }] };
      }

      function checkTextIterateLayers(layers) {
        for (const layer of layers) if (layer.ty === 5) updateTextLayer(layer);
      }

      function checkText(animationData) {
        if (checkVersion([4, 4, 14], animationData.v)) {
          checkTextIterateLayers(animationData.layers);
          if (animationData.assets)
            for (const asset of animationData.assets)
              if (asset.layers) checkTextIterateLayers(asset.layers);
        }
      }

      function checkChars(animationData) {
        if (animationData.chars && !checkVersion([4, 7, 99], animationData.v)) {
          for (const charData of animationData.chars) {
            if (charData.data?.shapes) {
              completeShapes(charData.data.shapes);
              charData.data.ip = 0;
              charData.data.op = 99999;
              charData.data.st = 0;
              charData.data.sr = 1;
              charData.data.ks = {
                p: { k: [0, 0], a: 0 },
                s: { k: [100, 100], a: 0 },
                a: { k: [0, 0], a: 0 },
                r: { k: 0, a: 0 },
                o: { k: 100, a: 0 },
              };
              if (!charData.t) {
                charData.data.shapes.push({ ty: "no" });
                charData.data.shapes[0].it.push({
                  p: { k: [0, 0], a: 0 },
                  s: { k: [100, 100], a: 0 },
                  a: { k: [0, 0], a: 0 },
                  r: { k: 0, a: 0 },
                  o: { k: 100, a: 0 },
                  sk: { k: 0, a: 0 },
                  sa: { k: 0, a: 0 },
                  ty: "tr",
                });
              }
            }
          }
        }
      }

      function checkPathPropertiesIterateLayers(layers) {
        for (const textLayer of layers) {
          if (textLayer.ty === 5) {
            const pathData = textLayer.t.p;
            if (typeof pathData.a === "number") pathData.a = { a: 0, k: pathData.a };

            if (typeof pathData.p === "number") pathData.p = { a: 0, k: pathData.p };

            if (typeof pathData.r === "number") pathData.r = { a: 0, k: pathData.r };
          }
        }
      }

      function checkPathProperties(animationData) {
        if (checkVersion([5, 7, 15], animationData.v)) {
          checkPathPropertiesIterateLayers(animationData.layers);
          if (animationData.assets) {
            for (const asset of animationData.assets)
              if (asset.layers) checkPathPropertiesIterateLayers(asset.layers);
          }
        }
      }

      function iterateShapes(shapes) {
        for (const shape of shapes) {
          if (shape.ty === "gr") {
            iterateShapes(shape.it);
          } else if (shape.ty === "fl" || shape.ty === "st") {
            if (shape.c.k?.[0].i) {
              for (const item of shape.c.k) {
                if (item.s) {
                  item.s[0] /= 255;
                  item.s[1] /= 255;
                  item.s[2] /= 255;
                  item.s[3] /= 255;
                }
                if (item.e) {
                  item.e[0] /= 255;
                  item.e[1] /= 255;
                  item.e[2] /= 255;
                  item.e[3] /= 255;
                }
              }
            } else {
              shape.c.k[0] /= 255;
              shape.c.k[1] /= 255;
              shape.c.k[2] /= 255;
              shape.c.k[3] /= 255;
            }
          }
        }
      }

      function checkColorsIterateLayers(layers) {
        for (const layer of layers) if (layer.ty === 4) iterateShapes(layer.shapes);
      }

      function checkColors(animationData) {
        if (checkVersion([4, 1, 9], animationData.v)) {
          checkColorsIterateLayers(animationData.layers);
          if (animationData.assets) {
            for (const asset of animationData.assets)
              if (asset.layers) checkColorsIterateLayers(asset.layers);
          }
        }
      }

      function completeClosingShapes(arr) {
        for (let i = arr.length - 1; i >= 0; i -= 1) {
          if (arr[i].ty === "sh") {
            if (arr[i].ks.k.i) {
              arr[i].ks.k.c = arr[i].closed;
            } else {
              for (const k of arr[i].ks.k) {
                if (k.s) k.s[0].c = arr[i].closed;

                if (k.e) k.e[0].c = arr[i].closed;
              }
            }
          } else if (arr[i].ty === "gr") {
            completeClosingShapes(arr[i].it);
          }
        }
      }

      function checkShapesIterateLayers(layers) {
        for (const layerData of layers) {
          if (layerData.hasMask) {
            const maskProps = layerData.masksProperties;
            for (const maskProp of maskProps) {
              if (maskProp.pt.k.i) {
                maskProp.pt.k.c = maskProp.cl;
              } else {
                for (const maskPropK of maskProp.pt.k) {
                  if (maskPropK.s) maskPropK.s[0].c = maskProp.cl;

                  if (maskPropK.e) maskPropK.e[0].c = maskProp.cl;
                }
              }
            }
          }
          if (layerData.ty === 4) completeClosingShapes(layerData.shapes);
        }
      }

      function checkShapes(animationData) {
        if (checkVersion([4, 4, 18], animationData.v)) {
          checkShapesIterateLayers(animationData.layers);
          if (animationData.assets) {
            for (const asset of animationData.assets)
              if (asset.layers) checkShapesIterateLayers(asset.layers);
          }
        }
      }

      function completeData(animationData) {
        if (animationData.__complete) return;

        checkColors(animationData);
        checkText(animationData);
        checkChars(animationData);
        checkPathProperties(animationData);
        checkShapes(animationData);
        completeLayers(animationData.layers, animationData.assets);
        completeChars(animationData.chars, animationData.assets);
        animationData.__complete = true;
      }

      function completeText(data) {
        if (data.t.a.length === 0 && !("m" in data.t.p)) {
          // data.singleShape = true;
        }
      }

      return {
        completeData,
        checkColors,
        checkChars,
        checkPathProperties,
        checkShapes,
        completeLayers,
      };
    }
    if (!_workerSelf.dataManager) _workerSelf.dataManager = dataFunctionManager();

    if (e.data.type === "complete") {
      const animation = e.data.animation;
      _workerSelf.dataManager.completeData(animation);
      _workerSelf.postMessage({ id: e.data.id, payload: animation, status: "success" });
    }
  });

  workerInstance.onmessage = function (event) {
    const data = event.data;
    const id = data.id;
    const process = processes[id];
    delete processes[id];
    if (process) {
      if (data.status === "success") {
        process.onComplete(data.payload);
      } else if (process.onError) {
        process.onError();
      }
    }
  };
}

const processes: Record<
  string,
  { onComplete: (arg?: any) => void; onError?: (arg?: any) => void }
> = {};

function createProcess(onComplete: (arg: any) => void, onError?: (arg: any) => void) {
  _counterId += 1;
  const id = "processId_" + String(_counterId);
  processes[id] = { onComplete, onError };
  return id;
}

export function completeAnimation(animation, onComplete, onError) {
  setupWorker();
  const id = createProcess(onComplete, onError);
  workerInstance.postMessage({ type: "complete", animation, id });
}
