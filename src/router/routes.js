
export default [
  {
    path: "/",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/earth2050/index.vue"),
  },
  {
    path: "/atmosphereEarth",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/atmosphereEarth/index.vue"),
  },
  {
    path: "/curveEarth",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/curveEarth/index.vue"),
  },
  {
    path: "/earth2050",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/earth2050/index.vue"),
  },
  {
    path: "/earth2050_2",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/earth2050_2/index.vue"),
  },
  {
    path: "/extrude_geometry_uv",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/extrude_geometry_uv/index.vue"),
  },
  {
    path: "/fresnelReflection",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/fresnelReflection/index.vue"),
  },
  {
    path: "/helicopter",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/helicopter/index.vue"),
  },
  {
    path: "/hoverEmergeMap",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/hoverEmergeMap/index.vue"),
  },
  {
    path: "/map3D",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/map3D/index.vue"),
  },
  {
    path: "/mapbox",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/mapbox/index.vue"),
  },
  {
    path: "/vertexAnimation",
    component: () =>
      import(/* webpackChunkName: "main" */ "@/examples/vertexAnimation/index.vue"),
  },
]