<template>
  <canvas id="webgl-container"></canvas>
</template>

<script>
import Render from "./index";
export default {
  components: {},
  mounted() {
    new Render();
  },
};
</script>

<style></style>
