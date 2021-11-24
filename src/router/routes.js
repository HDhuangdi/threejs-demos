
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
    path: "/helicopter",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/helicopter/index.vue"),
  },
  {
    path: "/hoverEmergeMap",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/hoverEmergeMap/index.vue"),
  },
  {
    path: "/map3D",
    component: () =>
      import(/* webpackChunkName: "404" */ "@/examples/map3D/index.vue"),
  },
]