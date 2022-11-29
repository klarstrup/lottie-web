export default function createNS(type: string) {
  return document.createElementNS("http://www.w3.org/2000/svg", type);
}
