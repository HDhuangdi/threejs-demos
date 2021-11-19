<template>
  <div id="webgl-container"></div>
</template>

<script>
import Render from "./examples/fresnelReflection";
export default {
  components: {},
  mounted() {
    new Render();
  },
};
</script>

<style></style>
