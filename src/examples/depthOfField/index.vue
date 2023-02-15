<template>
  <canvas width="512" height="512" ref="canvas" id="webgl-container"></canvas>
</template>

<script>
import Render from "./index";
export default {
  components: {},
  mounted() {
    new Render(this.$refs.canvas, 512, 512);
  },
};
</script>

<style></style>
