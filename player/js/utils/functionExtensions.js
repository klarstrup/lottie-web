export function extendPrototype(sources, destination) {
  for (const { prototype } of sources)
    for (const attr of Object.keys(prototype)) destination.prototype[attr] = prototype[attr];
}
