export default function getFontProperties(fontData) {
  const styles = fontData.fStyle ? fontData.fStyle.split(" ") : [];

  let fWeight = "normal";
  let fStyle = "normal";
  const len = styles.length;
  let styleName;
  for (let i = 0; i < len; i += 1) {
    styleName = styles[i].toLowerCase();
    switch (styleName) {
      case "italic":
        fStyle = "italic";
        break;
      case "bold":
        fWeight = "700";
        break;
      case "black":
        fWeight = "900";
        break;
      case "medium":
        fWeight = "500";
        break;
      case "regular":
      case "normal":
        fWeight = "400";
        break;
      case "light":
      case "thin":
        fWeight = "200";
        break;
      default:
        break;
    }
  }

  return { style: fStyle, weight: fontData.fWeight || fWeight };
}
