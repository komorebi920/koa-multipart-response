window.onload = function () {
  getMultipart();
};

function arraybuffer2Url(arraybuffer, contentType) {
  const blob = new Blob([arraybuffer], { type: contentType });
  return URL.createObjectURL(blob);
}

function arraybuffer2String(arraybuffer) {
  const parts = new Uint8Array(arraybuffer);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(parts);
}

function getMultipart() {
  axios
    .post("/multipart", null, { responseType: "arraybuffer" })
    .then(function (response) {
      var contentType = response.headers["content-type"];
      var boundary = contentType.match(/boundary=(.+)/)[1];

      // 截取图片数据
      // 如果将图片数据转换成字符串会出现数据字符丢失的现象，导致图片因数据错误无法渲染
      var imgRange = response.headers["custom-image-range"].split(",");
      var imageData = response.data.slice(imgRange[0], imgRange[1]);

      // 将响应数据转换成 string
      // 截取图片以外的部分，提升转换效率
      var responseText =
        arraybuffer2String(response.data.slice(0, imgRange[0])) +
        arraybuffer2String(response.data.slice(imgRange[1]));

      // 解析多部分响应数据
      parseMultipartResponse(responseText, imageData, boundary);
    })
    .catch(function (error) {
      console.error("请求发生错误:", error);
    });

  // 解析多部分响应数据
  function parseMultipartResponse(response, imageData, boundary) {
    // 使用换行符分割数据
    var parts = response.split("--" + boundary + "\r\n");

    // 遍历每个部分
    for (var i = 1; i <= parts.length - 1; i++) {
      var part = parts[i].trim();

      // 解析部分的 Content-Type
      var contentTypeMatch = part.match(/Content-Type: (.*)/);
      if (contentTypeMatch) {
        var contentType = contentTypeMatch[1].trim();

        switch (contentType) {
          case "application/json":
            // 解析 JSON 数据部分
            var jsonData = JSON.parse(part.split("\r\n\r\n")[1]);
            var span = document.getElementsByTagName("span")[0];
            span.innerHTML = JSON.stringify(jsonData);
            break;
          case "image/png":
            var blob = new Blob([imageData], { type: contentType });
            var url = URL.createObjectURL(blob);
            var img = document.getElementsByTagName("img")[0];
            img.src = url;
            img.onload = function () {
              URL.revokeObjectURL(url);
            };
            break;
          default:
            break;
        }
      }
    }
  }
}
