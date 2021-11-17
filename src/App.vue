<template>
  <div id="webgl-container"></div>
</template>

<script>
import Render from "./examples/atmosphereEarth";
export default {
  components: {},
  mounted() {
    new Render();
  },
};
</script>

<style></style>
