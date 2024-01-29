export function compareJSON(json1, json2) {
  const sortedJSON1 = JSON.stringify(json1, Object.keys(json1).sort());
  const sortedJSON2 = JSON.stringify(json2, Object.keys(json2).sort());

  return sortedJSON1 === sortedJSON2;
}
