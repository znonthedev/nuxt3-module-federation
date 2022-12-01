<template>
  <div>
      <ButtonTest/>
  </div>
</template>
<script setup>

const ButtonTest = defineAsyncComponent(() => import('remote/ButtonTest.vue'))
</script>
