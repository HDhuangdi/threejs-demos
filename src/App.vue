<template>
  <div id="webgl-container"></div>
</template>

<script>
import Render from "./earth2050";
export default {
  components: {},
  mounted() {
    new Render();
  },
};
</script>

<style></style>
