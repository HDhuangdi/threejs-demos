
export default [
  {
    path: "/",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/earth2050/index.vue"),
  },
  {
    path: "/atmosphereEarth",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/atmosphereEarth/index.vue"),
  },
  {
    path: "/curveEarth",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/curveEarth/index.vue"),
  },
  {
    path: "/earth2050",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/earth2050/index.vue"),
  },
  {
    path: "/fresnelReflection",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/fresnelReflection/index.vue"),
  },
  {
    path: "/helpers.js",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/helpers.js/index.vue"),
  },
  {
    path: "/template.js",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/template.js/index.vue"),
  },
]