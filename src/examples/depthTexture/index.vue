<template>
  <canvas width="1024" height="768" ref="canvas" id="webgl-container"></canvas>
</template>

<script>
import Render from "./index";
export default {
  components: {},
  mounted() {
    new Render(this.$refs.canvas, 1024, 768);
  },
};
</script>

<style></style>
