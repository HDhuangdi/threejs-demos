<template>
  <canvas width="500" height="700" ref="canvas" id="webgl-container"></canvas>
</template>

<script>
import Render from "./index";
export default {
  components: {},
  mounted() {
    new Render(this.$refs.canvas, 500, 700);
  },
};
</script>

<style></style>
