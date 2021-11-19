const fs = require("fs");
const resolve = (path) => require("path").resolve(__dirname, path);

let str = `
export default [
  {
    path: "/",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/earth2050/index.vue"),
  },`;

const examplePath = resolve("./src/examples");

const exampleSrc = fs.readdirSync(examplePath);
exampleSrc.forEach((name) => {
  const stat = fs.statSync(examplePath + "/" + name);
  if (stat.isDirectory) {
    str += `
  {
    path: "/${name}",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/${name}/index.vue"),
  },`;
  }
});

str += `
]`;

fs.writeFile(resolve("./src/router/routes.js"), str, (err) => {
  if (err) throw err;
});
