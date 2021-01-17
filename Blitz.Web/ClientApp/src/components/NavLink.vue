<template>
  <router-link :to="to" active-class="is-active" v-bind="$props" class="text--smallcaps navbar-item">
    <slot/>
  </router-link>
</template>

<script>
export default {
  name: "NavLink",
  props: ['to']
}
</script>