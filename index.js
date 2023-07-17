const Koa = require("koa");
const fs = require("fs");
const Router = require("koa-router");
const static = require("koa-static");
const mine = require("mime");
const router = new Router();
const app = new Koa();

// 指定了静态文件的根目录
app.use(static(__dirname + "/public"));

router.post("/multipart", async (ctx) => {
  // 分隔符
  const boundary = "boundary";

  // JSON 数据
  const jsonData = JSON.stringify({ message: "Hello, World!" });
  const jsonPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonData}\r\n`;

  // 图片数据
  const imagePath = `${__dirname}/images/202208272010391.png`;
  const imageBuffer = fs.readFileSync(imagePath);
  const imageContentType = mine.getType(imagePath);
  const imagePart = `--${boundary}\r\nContent-Type: ${imageContentType}\r\n\r\n`;

  // 合并数据
  const response = Buffer.concat([
    Buffer.from(jsonPart),
    Buffer.from(imagePart),
    imageBuffer,
    Buffer.from(`\r\n--${boundary}`),
  ]);

  console.log("image length:", imageBuffer.length); // 图片数据长度
  console.log("response length:", response.length); // 响应体长度

  // 完成响应
  ctx.response.status = 200;
  ctx.response.type = `multipart/x-mixed-replace; boundary=${boundary}`;
  ctx.set(
    "custom-image-range",
    `${Buffer.concat([Buffer.from(jsonPart), Buffer.from(imagePart)]).length},${
      Buffer.concat([
        Buffer.from(jsonPart),
        Buffer.from(imagePart),
        imageBuffer,
      ]).length
    }`
  );
  ctx.response.body = response;
});

// 将路由注册到应用
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
